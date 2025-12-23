import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

/**
 * UI state interface
 * Manages all UI-related state like dialogs, sheets, and filters
 */
interface UIState {
  // Sheet states
  isAddSheetOpen: boolean;
  isEditSheetOpen: boolean;
  isSettingsSheetOpen: boolean;

  // Dialog states
  isDeleteDialogOpen: boolean;
  isSyncDialogOpen: boolean;

  // Filter state
  selectedYear: number;
  filteredProblems: string[];

  // Actions
  setAddSheetOpen: (open: boolean) => void;
  setEditSheetOpen: (open: boolean) => void;
  setSettingsSheetOpen: (open: boolean) => void;
  setDeleteDialogOpen: (open: boolean) => void;
  setSyncDialogOpen: (open: boolean) => void;
  setSelectedYear: (year: number) => void;
  setFilteredProblems: (problems: string[]) => void;
}

/**
 * Zustand store for UI state
 * Manages dialogs, sheets, and filter states
 */
export const useUIStore = create<UIState>()(
  devtools((set) => ({
    // Initial state
    isAddSheetOpen: false,
    isEditSheetOpen: false,
    isSettingsSheetOpen: false,
    isDeleteDialogOpen: false,
    isSyncDialogOpen: false,
    selectedYear: new Date().getFullYear(),
    filteredProblems: [],

    // Actions
    setAddSheetOpen: (isAddSheetOpen) => set({ isAddSheetOpen }),
    setEditSheetOpen: (isEditSheetOpen) => set({ isEditSheetOpen }),
    setSettingsSheetOpen: (isSettingsSheetOpen) => set({ isSettingsSheetOpen }),
    setDeleteDialogOpen: (isDeleteDialogOpen) => set({ isDeleteDialogOpen }),
    setSyncDialogOpen: (isSyncDialogOpen) => set({ isSyncDialogOpen }),
    setSelectedYear: (selectedYear) => set({ selectedYear }),
    setFilteredProblems: (filteredProblems) => set({ filteredProblems }),
  }), { name: 'UIStore' })
);
