import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function DELETE(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: "Supabase credentials not configured" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { id, storage_path } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "Missing required field: id" },
        { status: 400 }
      );
    }

    // 1. Only remove from Supabase Storage if there is a storage file
    //    (YouTube/Vimeo embedded videos have no storage file)
    if (storage_path) {
      const { error: storageError } = await supabase.storage
        .from("project-videos")
        .remove([storage_path]);

      if (storageError) {
        console.error("Storage delete error:", storageError);
        return NextResponse.json(
          { error: "Failed to delete video file from storage" },
          { status: 500 }
        );
      }
    }

    // 2. Delete metadata row from database
    const { error: dbError } = await supabase
      .from("videos")
      .delete()
      .eq("id", id);

    if (dbError) {
      console.error("Database delete error:", dbError);
      return NextResponse.json(
        { error: "Video file deleted but failed to remove database record" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Delete handler error:", message);
    return NextResponse.json(
      { error: "Internal server error during deletion" },
      { status: 500 }
    );
  }
}
