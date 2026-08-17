import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ensureMvpUser } from "@/features/quests/questCompletion";
import { allItems, ItemSlot, WardrobeItem } from "@/data/items";

export type EquippedMap = Partial<Record<ItemSlot, string>>;

const wardrobeQueryKey = (userId: string | undefined) => ["wardrobe", userId] as const;

interface WardrobeState {
  unlocked: string[];
  equipped: EquippedMap;
}

async function fetchWardrobe(): Promise<{ userId: string; state: WardrobeState }> {
  const user = await ensureMvpUser();

  const [{ data: unlockedRows, error: unlockedError }, { data: profileRow, error: profileError }] =
    await Promise.all([
      supabase.from("user_items").select("item_id").eq("user_id", user.id),
      supabase.from("profiles").select("equipped_items").eq("user_id", user.id).maybeSingle(),
    ]);

  if (unlockedError) throw new Error(`Could not load wardrobe: ${unlockedError.message}`);
  if (profileError) throw new Error(`Could not load wardrobe: ${profileError.message}`);

  return {
    userId: user.id,
    state: {
      unlocked: (unlockedRows ?? []).map((row) => row.item_id),
      equipped: (profileRow?.equipped_items as EquippedMap | null) ?? {},
    },
  };
}

export async function unlockItem(itemId: string): Promise<void> {
  const user = await ensureMvpUser();
  const { error } = await supabase
    .from("user_items")
    .upsert({ user_id: user.id, item_id: itemId }, { onConflict: "user_id,item_id" });
  if (error) throw new Error(`Could not unlock item: ${error.message}`);
}

export async function equipItem(item: WardrobeItem): Promise<void> {
  const user = await ensureMvpUser();
  const { data: profileRow, error: readError } = await supabase
    .from("profiles")
    .select("equipped_items")
    .eq("user_id", user.id)
    .maybeSingle();
  if (readError) throw new Error(`Could not equip item: ${readError.message}`);

  const next: EquippedMap = { ...((profileRow?.equipped_items as EquippedMap | null) ?? {}), [item.slot]: item.id };
  const { error } = await supabase.from("profiles").update({ equipped_items: next }).eq("user_id", user.id);
  if (error) throw new Error(`Could not equip item: ${error.message}`);
}

export async function unequipSlot(slot: ItemSlot): Promise<void> {
  const user = await ensureMvpUser();
  const { data: profileRow, error: readError } = await supabase
    .from("profiles")
    .select("equipped_items")
    .eq("user_id", user.id)
    .maybeSingle();
  if (readError) throw new Error(`Could not unequip item: ${readError.message}`);

  const next: EquippedMap = { ...((profileRow?.equipped_items as EquippedMap | null) ?? {}) };
  delete next[slot];
  const { error } = await supabase.from("profiles").update({ equipped_items: next }).eq("user_id", user.id);
  if (error) throw new Error(`Could not unequip item: ${error.message}`);
}

export function useWardrobe() {
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: wardrobeQueryKey(undefined),
    queryFn: fetchWardrobe,
    staleTime: 30 * 1000,
  });

  const unlocked = data?.state.unlocked ?? [];
  const equipped = data?.state.equipped ?? {};

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["wardrobe"] });

  const unlockMutation = useMutation({ mutationFn: unlockItem, onSuccess: invalidate });
  const equipMutation = useMutation({ mutationFn: equipItem, onSuccess: invalidate });
  const unequipMutation = useMutation({ mutationFn: unequipSlot, onSuccess: invalidate });

  const equip = useCallback((item: WardrobeItem) => equipMutation.mutate(item), [equipMutation]);
  const unequip = useCallback((slot: ItemSlot) => unequipMutation.mutate(slot), [unequipMutation]);
  const unlock = useCallback((itemId: string) => unlockMutation.mutate(itemId), [unlockMutation]);

  const equippedItems: WardrobeItem[] = (Object.values(equipped) as string[])
    .map((id) => allItems.find((i) => i.id === id))
    .filter((i): i is WardrobeItem => Boolean(i));

  const unlockedItems: WardrobeItem[] = unlocked
    .map((id) => allItems.find((i) => i.id === id))
    .filter((i): i is WardrobeItem => Boolean(i));

  return { unlocked, unlockedItems, equipped, equippedItems, equip, unequip, unlock };
}
