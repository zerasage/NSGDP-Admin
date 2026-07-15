import Link from "next/link";
import Image from "next/image";
import { Database } from "lucide-react";
import type { Group } from "@/types";
import { cn } from "@/lib/utils";

interface GroupTileProps {
  group: Group;
  className?: string;
}

// Tailwind gradient colors for groups without cover images
const GRADIENT_COLORS = [
  "from-blue-500 to-cyan-500",
  "from-green-500 to-teal-500",
  "from-purple-500 to-pink-500",
  "from-orange-500 to-red-500",
  "from-indigo-500 to-blue-500",
  "from-teal-500 to-green-500",
  "from-pink-500 to-rose-500",
  "from-amber-500 to-orange-500",
  "from-violet-500 to-purple-500",
  "from-emerald-500 to-green-500",
];

export function GroupTile({ group, className }: GroupTileProps) {
  // Use group ID hash to consistently pick a gradient
  const gradientIndex = parseInt(group.id.replace(/\D/g, "")) % GRADIENT_COLORS.length;
  const gradientClass = GRADIENT_COLORS[gradientIndex];

  return (
    <Link href={`/groups/${group.slug}`}>
      <div
        className={cn(
          "topic-tile group relative aspect-[4/3] overflow-hidden rounded-xl transition-all duration-200 hover:shadow-xl hover:-translate-y-1",
          className
        )}
      >
        {/* Background: Cover Image or Gradient */}
        {group.coverImageUrl ? (
          <Image
            src={group.coverImageUrl}
            alt=""
            fill
            className="object-cover transition-transform group-hover:scale-105 duration-300"
          />
        ) : (
          <div
            className={cn(
              "absolute inset-0 bg-gradient-to-br",
              gradientClass
            )}
          />
        )}

        {/* Overlay - Enhanced depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent transition-opacity group-hover:from-black/90" />

        {/* Content */}
        <div className="absolute inset-0 flex flex-col justify-end p-4 text-white">
          <h3 className="topic-title text-lg font-bold leading-tight mb-2">
            {group.name}
          </h3>
          <div className="topic-count flex items-center gap-1.5 text-sm text-white/95 font-medium">
            <Database className="size-4" />
            <span>{group.datasetCount} dataset{group.datasetCount !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
