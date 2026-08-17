import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Heart, Send } from "lucide-react";
import { useAddComment, useComments, useJournalEntry, useToggleJournalLike } from "@/features/journal/useJournal";

const JournalEntryPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: entry, isLoading } = useJournalEntry(id);
  const { data: comments } = useComments(id);
  const toggleLike = useToggleJournalLike();
  const addComment = useAddComment();
  const [commentText, setCommentText] = useState("");

  if (isLoading) {
    return <div className="flex items-center justify-center h-full p-8 text-sm text-muted-foreground">Loading...</div>;
  }

  if (!entry) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <p className="text-4xl mb-3">😕</p>
        <p className="font-bold">Journal entry not found</p>
        <button className="mt-4 text-sm font-bold text-primary" onClick={() => navigate("/community")}>
          Back to Community
        </button>
      </div>
    );
  }

  const handlePostComment = () => {
    if (!commentText.trim() || !id) return;
    addComment.mutate({ entryId: id, content: commentText });
    setCommentText("");
  };

  return (
    <div className="flex flex-col min-h-full">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
        <button onClick={() => navigate(-1)} className="p-1">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold">Journal Entry</h1>
      </div>

      <div className="flex-1 px-5 py-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-lg">
            {entry.author.countryFlag}
          </div>
          <div>
            <p className="text-sm font-bold">{entry.author.displayName}</p>
            <p className="text-[11px] text-muted-foreground">{new Date(entry.createdAt).toLocaleString()}</p>
          </div>
        </div>

        {entry.photoUrl && (
          <img src={entry.photoUrl} alt="Journal entry" className="w-full rounded-2xl object-cover max-h-96" />
        )}

        <p className="text-sm leading-relaxed whitespace-pre-wrap">{entry.content}</p>

        <button
          onClick={() => toggleLike.mutate(entry.id)}
          disabled={toggleLike.isPending}
          className={`flex items-center gap-1.5 text-sm font-semibold ${
            entry.likedByMe ? "text-destructive" : "text-muted-foreground"
          }`}
        >
          <Heart size={18} className={entry.likedByMe ? "fill-current" : ""} />
          {entry.likeCount}
        </button>

        <div className="pt-2 border-t border-border space-y-3">
          <p className="text-sm font-bold">Comments ({comments?.length ?? 0})</p>
          {(comments ?? []).map((c) => (
            <div key={c.id} className="flex items-start gap-2.5">
              <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-sm shrink-0">
                {c.author.countryFlag}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold">{c.author.displayName}</p>
                <p className="text-sm">{c.content}</p>
              </div>
            </div>
          ))}
          {comments?.length === 0 && (
            <p className="text-xs text-muted-foreground">No comments yet. Say something! 💬</p>
          )}
        </div>
      </div>

      <div className="sticky bottom-0 bg-background/90 backdrop-blur-md border-t border-border px-5 py-3 flex gap-2">
        <input
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handlePostComment()}
          placeholder="Add a comment..."
          className="flex-1 rounded-full bg-muted px-4 py-2 text-sm outline-none"
        />
        <button
          onClick={handlePostComment}
          disabled={addComment.isPending || !commentText.trim()}
          className="bg-primary text-primary-foreground rounded-full w-10 h-10 flex items-center justify-center shrink-0 disabled:opacity-50"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
};

export default JournalEntryPage;
