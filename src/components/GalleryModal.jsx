import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';

function GalleryModal({ image, isOpen, onClose }) {
  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-[80]">
      <div className="fixed inset-0 bg-[#0f2240]/75" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center overflow-y-auto p-4">
        <DialogPanel className="w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl">
          {image && (
            <>
              <div className="max-h-[75vh] bg-slate-100">
                <img
                  src={image.imageBase64}
                  alt={image.caption}
                  className="max-h-[75vh] w-full object-contain"
                />
              </div>

              <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
                <DialogTitle className="text-2xl font-black leading-8 text-[#0f2240]">
                  {image.caption}
                </DialogTitle>
                <button
                  type="button"
                  onClick={onClose}
                  className="min-h-12 rounded-2xl bg-[#0f2240] px-6 py-3 text-lg font-bold text-white transition hover:bg-[#17365f] focus:outline-none focus:ring-4 focus:ring-[#d4a373]/50"
                >
                  סגירה
                </button>
              </div>
            </>
          )}
        </DialogPanel>
      </div>
    </Dialog>
  );
}

export default GalleryModal;
