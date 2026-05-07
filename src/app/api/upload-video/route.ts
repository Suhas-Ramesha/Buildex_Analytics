import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    // We should use service role key for admin operations if we bypass RLS, or anon key if RLS is setup.
    // For this simple app, we'll use service role key if available, otherwise anon.
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Supabase credentials not configured" }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const formData = await request.formData();
    const title = formData.get("title") as string;
    const uploader = formData.get("uploader") as string;
    const description = formData.get("description") as string;
    const file = formData.get("file") as File;

    if (!title || !uploader || !file) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Upload file to Supabase Storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const storagePath = `uploads/${fileName}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { data: storageData, error: storageError } = await supabase
      .storage
      .from("project-videos")
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false
      });

    if (storageError) {
      console.error("Storage upload error:", storageError);
      return NextResponse.json({ error: "Failed to upload video file" }, { status: 500 });
    }

    // 2. Get Public URL
    const { data: publicUrlData } = supabase
      .storage
      .from("project-videos")
      .getPublicUrl(storagePath);

    const publicUrl = publicUrlData.publicUrl;

    // 3. Insert metadata into Database
    const { data: dbData, error: dbError } = await supabase
      .from("videos")
      .insert([
        {
          title,
          uploader,
          description,
          storage_path: storagePath,
          public_url: publicUrl
        }
      ])
      .select()
      .single();

    if (dbError) {
      console.error("Database insert error:", dbError);
      // Optional: cleanup the uploaded file if DB insert fails
      return NextResponse.json({ error: "Failed to save video metadata" }, { status: 500 });
    }

    return NextResponse.json({ success: true, video: dbData });

  } catch (error) {
    console.error("Upload handler error:", error);
    return NextResponse.json({ error: "Internal server error during upload" }, { status: 500 });
  }
}
