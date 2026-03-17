import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  FolderOpen, Trash2, ChevronRight, Library, Lock, Globe,
  MoreHorizontal
} from 'lucide-react';
import { useCollections, type UserCollection } from '@/hooks/use-reflections';

export function CollectionsGallery() {
  const { collections, loading, deleteCollection } = useCollections();

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-secondary animate-pulse" />
        ))}
      </div>
    );
  }

  if (collections.length === 0) {
    return (
      <Card className="border-dashed border-primary/10">
        <CardContent className="py-12 text-center">
          <Library className="h-10 w-10 mx-auto text-muted-foreground/15 mb-3" />
          <p className="text-sm font-medium text-foreground/70">Your Creative Library</p>
          <p className="text-[11px] text-muted-foreground mt-1 max-w-[220px] mx-auto">
            Save posts, presets, and mood boards into collections. Build your personal reference library.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-primary/15 flex items-center justify-center">
            <Library className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground tracking-tight">My Collections</h2>
            <p className="text-[10px] text-muted-foreground">{collections.length} collections</p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {collections.map(col => (
          <CollectionRow
            key={col.id}
            collection={col}
            onDelete={() => deleteCollection(col.id)}
          />
        ))}
      </div>
    </div>
  );
}

function CollectionRow({ collection, onDelete }: { collection: UserCollection; onDelete: () => void }) {
  const [showActions, setShowActions] = useState(false);

  return (
    <Card className="overflow-hidden hover:border-primary/15 transition-colors group">
      <CardContent className="p-3 flex items-center gap-3">
        <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-primary/10 to-secondary flex items-center justify-center text-xl shrink-0">
          {collection.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-xs font-semibold text-foreground truncate">{collection.name}</p>
            {collection.is_private ? (
              <Lock className="h-2.5 w-2.5 text-muted-foreground/30" />
            ) : (
              <Globe className="h-2.5 w-2.5 text-muted-foreground/30" />
            )}
          </div>
          <p className="text-[10px] text-muted-foreground">
            {collection.item_count} {collection.item_count === 1 ? 'item' : 'items'}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={e => { e.stopPropagation(); setShowActions(!showActions); }}
            className="p-1.5 rounded-lg hover:bg-secondary transition-colors opacity-0 group-hover:opacity-100"
          >
            <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          <ChevronRight className="h-4 w-4 text-muted-foreground/20" />
        </div>
      </CardContent>
      {showActions && (
        <div className="px-3 pb-3 flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            className="text-[10px] h-7 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={onDelete}
          >
            <Trash2 className="h-3 w-3 mr-1" /> Delete
          </Button>
        </div>
      )}
    </Card>
  );
}
