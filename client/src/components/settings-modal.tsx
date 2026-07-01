import { Modal, ModalBody, ModalContent, ModalHeader } from "@heroui/modal";
import { Switch } from "@heroui/switch";

import { SettingsStore } from "@/store/settings";

export function SettingsModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const {
    soundEnabled,
    focusMode,
    reducedMotion,
    setSoundEnabled,
    setFocusMode,
    setReducedMotion,
  } = SettingsStore();

  return (
    <Modal isOpen={isOpen} placement="center" onClose={onClose}>
      <ModalContent className="border-foreground-100/70 bg-content1/90 rounded-2xl border">
        <ModalHeader className="flex flex-col gap-1 pt-6 pb-2 text-lg font-bold">
          Settings
        </ModalHeader>
        <ModalBody className="flex flex-col gap-5 pt-2 pb-6">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold">Sound Effects</span>
              <span className="text-foreground-500 text-xs">
                Play sounds for moves, wins, and events
              </span>
            </div>
            <Switch
              aria-label="Toggle sound effects"
              isSelected={soundEnabled}
              onValueChange={setSoundEnabled}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold">Focus Mode</span>
              <span className="text-foreground-500 text-xs">
                Highlight the active mini-board on your turn
              </span>
            </div>
            <Switch
              aria-label="Toggle focus mode"
              isSelected={focusMode}
              onValueChange={setFocusMode}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold">Reduced Motion</span>
              <span className="text-foreground-500 text-xs">
                Minimize animations throughout the game
              </span>
            </div>
            <Switch
              aria-label="Toggle reduced motion"
              isSelected={reducedMotion}
              onValueChange={setReducedMotion}
            />
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
