import { useProfileLens } from "./use-profile-lens";

export function usePermissions() {
  const { isParentView } = useProfileLens();

  return {
    canCreate: isParentView,
    canEdit: isParentView,
    canDelete: isParentView,
    canAssign: isParentView,
    isReadOnlyChild: !isParentView,
  };
}
