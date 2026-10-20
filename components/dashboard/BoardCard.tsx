"use client";

import Link from "next/link";
import type { Board } from "@/lib/types";

function timeAgo(ts: number) {
  const mins = Math.round((Date.now() - ts) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  return new Date(ts).toLocaleDateString();
}

export default function BoardCard({ board }: { board: Board }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
      <Link href={`/board/${board.id}`} className="block">
        <h3 className="truncate font-medium">{board.name}</h3>
        <p className="mt-1 text-sm text-zinc-500">
          Last opened {timeAgo(board.lastOpenedAt)}
        </p>
      </Link>
    </div>
  );
}
