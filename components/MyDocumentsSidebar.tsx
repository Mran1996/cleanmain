"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function MyDocumentsSidebar({ userId, onSelectProject }: {
  userId: string;
  onSelectProject: (project: any) => void;
}) {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);

  // --- fetch projects on mount ---
  useEffect(() => {
    if (!userId) return;
    (async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) toast.error(error.message);
      else setProjects(data || []);
      setLoading(false);
    })();
  }, [userId]);

  // --- delete project ---
  async function handleDelete(id: string) {
    if (!confirm("Delete this project?")) return;
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      setProjects(projects.filter((p) => p.id !== id));
      if (id === activeId) setActiveId(null);
      toast.success("Project deleted");
    }
  }

  // --- select project ---
  async function handleSelect(p: any) {
    setActiveId(p.id);
    onSelectProject(p);
  }

  if (loading) return <div className="p-4 text-sm text-muted-foreground">Loading projects...</div>;

  return (
    <div className="w-64 border-r bg-muted/30 flex flex-col">
      <div className="p-3 border-b flex justify-between items-center">
        <h2 className="font-semibold text-sm">📁 My Documents</h2>
        <Button size="sm" variant="outline" onClick={() => location.reload()}>
          + New
        </Button>
      </div>

      <ScrollArea className="flex-1">
        {projects.length === 0 && (
          <p className="p-3 text-sm text-muted-foreground">No saved projects yet.</p>
        )}
        {projects.map((p) => (
          <div
            key={p.id}
            onClick={() => handleSelect(p)}
            className={`flex justify-between items-center px-3 py-2 cursor-pointer hover:bg-accent rounded-sm ${
              activeId === p.id ? "bg-accent" : ""
            }`}
          >
            <div>
              <p className="font-medium text-sm">{p.title || "Untitled Document"}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(p.created_at).toLocaleDateString()}
              </p>
            </div>
            <button
              className="text-red-500 text-xs hover:text-red-700"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(p.id);
              }}
            >
              🗑
            </button>
          </div>
        ))}
      </ScrollArea>
    </div>
  );
}








