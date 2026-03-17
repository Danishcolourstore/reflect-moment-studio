import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  FolderPlus, Plus, Check, Bookmark, Heart, Camera,
  Palette, Sparkles, Image, Star
} from 'lucide-react';
import { useCollections, type UserCollection } from '@/hooks/use-reflections';

const COLLECTION_ICONS = [
  { icon: '📁', label: 'Folder' },
  { icon: '💍', label: 'Wedding' },
  { icon: '🌙', label: 'Moody' },
  { icon: '☀️', label: 'Bright' },
  { icon: '🎨', label: 'Color' },
  { icon: '📸', label: 'Poses' },
  { icon: '💡', label: 'Tips' },
  { icon: '✨', label: 'Presets' },
  { icon: '🏔️', label: 'Travel' },
  { icon: '👶', label: 'Family' },
];

interface SaveToCollectionSheetProps {
  open: boolean;
  onClose: () => void;
  itemToSave: {
    item_type: string;
    item_id: string;
    item_title?: string;
    item_image?: string;
    item_data?: any;
  } | null;
}

export function SaveToCollectionSheet({ open, onClose, itemToSave }: SaveToCollectionSheetProps) {
  const { collections, createCollection, addToCollection } = useCollections();
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('📁');
  const [savedTo, setSavedTo] = useState<string | null>(null);

  const handleSaveToExisting = async (collection: UserCollection) => {
    if (!itemToSave) return;
    await addToCollection(collection.id, itemToSave);
    setSavedTo(collection.id);
    setTimeout(() => {
      setSavedTo(null);
      onClose();
    }, 1200);
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    const col = await createCollection(newName.trim(), selectedIcon);
    if (col && itemToSave) {
      await addToCollection(col.id, itemToSave);
      setSavedTo(col.id);
      setTimeout(() => {
        setSavedTo(null);
        setCreating(false);
        setNewName('');
        onClose();
      }, 1200);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => { onClose(); setCreating(false); setNewName(''); }}>
      <DialogContent className="max-w-sm p-0 overflow-hidden bg-card border-border">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="text-sm font-semibold flex items-center gap-2">
            <Bookmark className="h-4 w-4 text-primary" />
            Save to Collection
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-72 px-4">
          <div className="space-y-2 pb-4">
            {/* Existing Collections */}
            {collections.map(col => (
              <button
                key={col.id}
                onClick={() => handleSaveToExisting(col)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left ${
                  savedTo === col.id
                    ? 'bg-green-500/10 border border-green-500/30'
                    : 'bg-secondary/50 hover:bg-secondary border border-transparent'
                }`}
              >
                <span className="text-lg">{col.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{col.name}</p>
                  <p className="text-[9px] text-muted-foreground">{col.item_count} items</p>
                </div>
                {savedTo === col.id ? (
                  <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center animate-in zoom-in-50">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                ) : (
                  <Plus className="h-4 w-4 text-muted-foreground/30" />
                )}
              </button>
            ))}

            {collections.length === 0 && !creating && (
              <div className="text-center py-6">
                <FolderPlus className="h-8 w-8 mx-auto text-muted-foreground/20 mb-2" />
                <p className="text-xs text-muted-foreground">No collections yet</p>
                <p className="text-[10px] text-muted-foreground/60">Create your first creative library below</p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Create New */}
        <div className="border-t border-border p-4 space-y-3">
          {creating ? (
            <>
              {/* Icon Selector */}
              <div className="flex gap-1.5 flex-wrap">
                {COLLECTION_ICONS.map(({ icon }) => (
                  <button
                    key={icon}
                    onClick={() => setSelectedIcon(icon)}
                    className={`h-8 w-8 rounded-lg text-sm flex items-center justify-center transition-all ${
                      selectedIcon === icon
                        ? 'bg-primary/20 ring-1 ring-primary/50'
                        : 'bg-secondary hover:bg-secondary/80'
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="Collection name..."
                  className="text-xs h-9"
                  autoFocus
                  onKeyDown={e => e.key === 'Enter' && handleCreate()}
                />
                <Button size="sm" className="h-9 px-4 text-xs" onClick={handleCreate} disabled={!newName.trim()}>
                  Save
                </Button>
              </div>
            </>
          ) : (
            <Button
              variant="outline"
              className="w-full text-xs h-9 gap-2 border-dashed border-primary/20 text-primary hover:bg-primary/10"
              onClick={() => setCreating(true)}
            >
              <FolderPlus className="h-3.5 w-3.5" /> New Collection
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
