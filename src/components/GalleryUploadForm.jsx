import { useState } from 'react';

function GalleryUploadForm({ onSubmit, saving }) {
  const [file, setFile] = useState(null);
  const [caption, setCaption] = useState('');
  const [validationError, setValidationError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();

    if (!file) {
      setValidationError('Please choose an image file.');
      return;
    }

    if (!caption.trim()) {
      setValidationError('Please add a caption for accessibility.');
      return;
    }

    setValidationError('');
    await onSubmit({ file, caption });
    setFile(null);
    setCaption('');
    event.currentTarget.reset();
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-3xl bg-white p-6 shadow-lg ring-1 ring-slate-200">
      <h2 className="text-3xl font-black text-[#0f2240]">Upload image</h2>
      <p className="mt-2 text-lg leading-8 text-slate-700">
        Add a photo and descriptive alt text for visitors using screen readers.
      </p>

      <div className="mt-6 grid gap-5">
        <label className="grid gap-2 text-lg font-bold text-[#0f2240]">
          Image file
          <input
            type="file"
            accept="image/*"
            onChange={(event) => setFile(event.target.files?.[0] || null)}
            className="rounded-2xl border border-slate-300 bg-white p-4 text-lg text-slate-800 file:ml-4 file:rounded-xl file:border-0 file:bg-[#d4a373] file:px-5 file:py-3 file:text-base file:font-bold file:text-[#0f2240]"
            required
          />
        </label>

        <label className="grid gap-2 text-lg font-bold text-[#0f2240]">
          Caption
          <input
            type="text"
            value={caption}
            onChange={(event) => setCaption(event.target.value)}
            placeholder="Describe what appears in the image"
            className="min-h-14 rounded-2xl border border-slate-300 px-4 text-lg text-slate-800 focus:border-[#0f2240] focus:outline-none focus:ring-4 focus:ring-[#d4a373]/30"
            required
          />
        </label>
      </div>

      {validationError && (
        <p className="mt-4 rounded-2xl bg-red-50 p-4 text-lg font-semibold text-red-700">
          {validationError}
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="mt-6 min-h-14 rounded-2xl bg-[#0f2240] px-7 py-3 text-lg font-black text-white transition hover:bg-[#17365f] disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {saving ? 'Uploading...' : 'Upload image'}
      </button>
    </form>
  );
}

export default GalleryUploadForm;
