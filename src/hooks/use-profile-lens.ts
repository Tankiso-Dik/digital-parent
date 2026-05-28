import { useAppStore } from "@/stores";

export function useProfileLens() {
  const activeMemberId = useAppStore((state) => state.activeMemberId);

  return {
    activeMemberId,
    isParentView: activeMemberId === null,
    isChildView: activeMemberId !== null,
  };
}
