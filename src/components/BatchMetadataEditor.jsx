import React, { useState, useCallback } from 'react';
import { Upload, X, Check, Settings, Play, Download, Share2, Music, Trash2, Layers, Wand2, Loader2, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Dropzone from './Dropzone';
import { readTags, writeTags } from '../utils/metadata';
import { addWatermarkToImage } from '../utils/watermark';

const BatchMetadataEditor = () => {
    const [files, setFiles] = useState([]);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [showModal, setShowModal] = useState(false);
    const [processedFiles, setProcessedFiles] = useState([]);

    const [batchOptions, setBatchOptions] = useState({
        watermark: {
            enabled: true,
            position: 'bottom',
            color: 'yellow'
        },
        metadata: {
            album: '',
            artist: '',
            genre: '',
            year: '',
            track: '',
            comment: '',
            albumArtist: ''
        }
    });

    const handleFilesAdded = useCallback((newFiles) => {
        const newItems = newFiles.map(f => ({
            id: Math.random().toString(36).substr(2, 9),
            file: f,
            name: f.name,
            size: f.size
        }));
        setFiles(prev => [...prev, ...newItems]);
        setSelectedIds(prev => {
            const next = new Set(prev);
            newItems.forEach(item => next.add(item.id));
            return next;
        });
    }, []);

    const toggleSelect = (id) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === files.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(files.map(f => f.id)));
        }
    };

    const removeFile = (id) => {
        setFiles(prev => prev.filter(f => f.id !== id));
        setSelectedIds(prev => {
            const next = new Set(prev);
            next.delete(id);
            return next;
        });
    };

    const handleOptionChange = (field, value) => {
        setBatchOptions(prev => ({
            ...prev,
            metadata: { ...prev.metadata, [field]: value }
        }));
    };

    const startBatchProcess = async (action) => {
        setIsProcessing(true);
        setProgress(0);
        const results = [];
        const selectedFiles = files.filter(f => selectedIds.has(f.id));

        for (let i = 0; i < selectedFiles.length; i++) {
            const item = selectedFiles[i];
            try {
                const existingTags = await readTags(item.file);
                const mainSuffix = " - SumanOnline.Com";
                const defaultBrand = "SumanOnline.Com";

                // 1. Title Logic: original + suffix
                let currentTitle = existingTags.title || "Unknown";
                if (!currentTitle.endsWith(mainSuffix)) {
                    currentTitle += mainSuffix;
                }

                // 2. Metadata Logic: Keep existing if present, else use batch default
                const metaToSave = {
                    title: currentTitle,
                    artist: existingTags.artist || batchOptions.metadata.artist || defaultBrand,
                    album: existingTags.album || batchOptions.metadata.album || defaultBrand,
                    genre: existingTags.genre || batchOptions.metadata.genre || defaultBrand,
                    year: existingTags.year || batchOptions.metadata.year || defaultBrand,
                    track: existingTags.track || batchOptions.metadata.track || defaultBrand,
                    comment: existingTags.comment || batchOptions.metadata.comment || "This mp3 File Is Downloaded From SumanOnline.Com",
                    albumArtist: existingTags.albumArtist || batchOptions.metadata.albumArtist || defaultBrand
                };

                // 3. Watermark Logic
                let finalCoverFile = null;
                if (batchOptions.watermark.enabled && existingTags.cover) {
                    try {
                        const res = await fetch(existingTags.cover);
                        const blob = await res.blob();
                        const coverFile = new File([blob], "cover.jpg", { type: blob.type });
                        const watermarkedBlob = await addWatermarkToImage(coverFile, {
                            color: batchOptions.watermark.color,
                            position: batchOptions.watermark.position
                        });
                        finalCoverFile = new File([watermarkedBlob], "cover.jpg", { type: "image/jpeg" });
                    } catch (e) {
                        console.error("Watermark failed", e);
                    }
                } else if (existingTags.cover) {
                    const res = await fetch(existingTags.cover);
                    const blob = await res.blob();
                    finalCoverFile = new File([blob], "cover.jpg", { type: blob.type });
                }

                const newBlob = await writeTags(item.file, metaToSave, finalCoverFile);

                // Construct Filename
                const titleBase = currentTitle.replace(mainSuffix, "").trim();
                const artistInput = (metaToSave.artist || "Unknown").trim();
                const firstArtist = artistInput.split(/[,&/]|ft\.|feat\./i)[0].trim();
                const newName = `${titleBase} - ${firstArtist}${mainSuffix}.mp3`.replace(/[/\\?%*:|"<>]/g, '-');

                const processedFile = new File([newBlob], newName, { type: 'audio/mpeg' });
                results.push({ id: item.id, file: processedFile, name: newName });

                if (action === 'download') {
                    const url = URL.createObjectURL(processedFile);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = newName;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                } else if (action === 'upload') {
                    const formData = new FormData();
                    formData.append('file', processedFile);
                    await fetch('upload.php', { method: 'POST', body: formData });
                }

            } catch (err) {
                console.error("Processing failed", err);
            }
            setProgress(Math.round(((i + 1) / selectedFiles.length) * 100));
        }

        if (action === 'upload') {
            alert("Batch upload complete!");
        }

        setProcessedFiles(results);
        setIsProcessing(false);
        setShowModal(false);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <section className="text-center space-y-4 py-4">
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-3xl md:text-4xl font-bold text-white flex items-center justify-center gap-3"
                >
                    <Layers className="w-8 h-8 text-purple-400" />
                    Batch Metadata Editor
                </motion.h2>
                <p className="text-white/60">
                    Upload and process multiple files. Updates titles and applies default tags where missing.
                </p>
            </section>

            {files.length === 0 ? (
                <Dropzone onFilesAdded={handleFilesAdded} />
            ) : (
                <div className="space-y-6">
                    <div className="glass-panel p-6 border-purple-500/20">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <input
                                    type="checkbox"
                                    checked={selectedIds.size === files.length && files.length > 0}
                                    onChange={toggleSelectAll}
                                    className="w-5 h-5 rounded border-white/20 bg-black/20 text-purple-600 focus:ring-purple-500/50"
                                />
                                <h3 className="text-xl font-bold">Files ({files.length})</h3>
                            </div>
                            <button
                                onClick={() => setFiles([])}
                                className="text-sm text-white/40 hover:text-red-400 transition-colors"
                            >
                                Clear All
                            </button>
                        </div>

                        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                            {files.map((item) => (
                                <div
                                    key={item.id}
                                    onClick={() => toggleSelect(item.id)}
                                    className={`p-4 rounded-2xl border transition-all flex items-center gap-4 cursor-pointer
                            ${selectedIds.has(item.id)
                                            ? 'bg-purple-500/10 border-purple-500/30 shadow-lg shadow-purple-500/5'
                                            : 'bg-white/5 border-transparent hover:border-white/10'
                                        }
                        `}
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.has(item.id)}
                                        onChange={() => { }}
                                        className="w-5 h-5 rounded border-white/20 bg-black/20 text-purple-600 focus:ring-purple-500/50 cursor-pointer"
                                    />
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center flex-shrink-0">
                                        <Music className="w-6 h-6 text-purple-300" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate">
                                            {processedFiles.find(p => p.id === item.id)?.name || item.name}
                                        </p>
                                        <p className="text-xs text-white/40">
                                            {processedFiles.find(p => p.id === item.id)
                                                ? "Processed & Branded"
                                                : (item.size / 1024 / 1024).toFixed(2) + " MB"}
                                        </p>
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); removeFile(item.id); }}
                                        className="p-2 hover:bg-red-500/20 rounded-xl text-white/20 hover:text-red-400 transition-colors"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 flex flex-col sm:flex-row gap-4">
                            <label className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl font-semibold transition-all cursor-pointer">
                                <Upload className="w-5 h-5 text-purple-400" />
                                <span>Add More Files</span>
                                <input type="file" multiple accept=".mp3" className="hidden" onChange={(e) => e.target.files && handleFilesAdded(Array.from(e.target.files))} />
                            </label>
                            <button
                                onClick={() => setShowModal(true)}
                                disabled={selectedIds.size === 0}
                                className="flex-[2] bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white py-4 rounded-2xl font-bold shadow-xl shadow-purple-500/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                            >
                                <Settings className="w-6 h-6" />
                                Edit Batch Files ({selectedIds.size})
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* REFINED BATCH EDIT MODAL */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => !isProcessing && setShowModal(false)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-md"
                        />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-4xl max-h-[95vh] bg-gradient-to-b from-slate-900 to-black rounded-[32px] border border-white/10 shadow-3xl overflow-hidden flex flex-col"
                        >
                            {/* Fixed Modal Header */}
                            <div className="p-6 md:p-8 border-b border-white/5 flex items-center justify-between flex-shrink-0">
                                <h2 className="text-xl md:text-2xl font-bold flex items-center gap-3">
                                    <div className="p-2 bg-purple-500/20 rounded-lg">
                                        <Layers className="w-5 h-5 md:w-6 md:h-6 text-purple-400" />
                                    </div>
                                    Batch Settings
                                </h2>
                                {!isProcessing && (
                                    <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/5 rounded-full text-white/40 hover:text-white transition-colors">
                                        <X className="w-6 h-6" />
                                    </button>
                                )}
                            </div>

                            {/* Scrollable Modal Content */}
                            <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar flex-1">

                                <div className="flex flex-col md:flex-row gap-8">
                                    {/* LEFT: Watermark Section */}
                                    <div className="w-full md:w-1/3 space-y-6">
                                        <div className="aspect-square rounded-3xl bg-black/40 border border-white/10 flex flex-col items-center justify-center relative overflow-hidden group">
                                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent" />
                                            <Wand2 className="w-16 h-16 text-white/10 mb-4" />
                                            <p className="text-xs font-bold text-white/30 tracking-widest uppercase">Cover Overlay</p>

                                            {/* Real-time Watermark Simulation */}
                                            <AnimatePresence>
                                                {batchOptions.watermark.enabled && (
                                                    <motion.div
                                                        initial={{ opacity: 0, scale: 0.8 }}
                                                        animate={{
                                                            opacity: 1,
                                                            scale: 1,
                                                            y: batchOptions.watermark.position === 'top' ? -60 :
                                                                batchOptions.watermark.position === 'center' ? 0 : 60
                                                        }}
                                                        exit={{ opacity: 0, scale: 0.8 }}
                                                        className={`absolute inset-0 flex items-center justify-center pointer-events-none`}
                                                    >
                                                        <span className={`
                                        text-[10px] font-black tracking-wider px-2 py-0.5 rounded backdrop-blur-[2px] border border-white/5
                                        ${batchOptions.watermark.color === 'yellow' ? 'text-yellow-400 bg-yellow-400/10' : ''}
                                        ${batchOptions.watermark.color === 'white' ? 'text-white bg-white/10' : ''}
                                        ${batchOptions.watermark.color === 'red' ? 'text-red-500 bg-red-500/10' : ''}
                                        ${batchOptions.watermark.color === 'black' ? 'text-black bg-black/40' : ''}
                                    `}>
                                                            SumanOnline.Com
                                                        </span>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>

                                            {batchOptions.watermark.enabled && (
                                                <motion.div
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    className="absolute bottom-2 left-0 right-0 text-center"
                                                >
                                                    <span className="bg-purple-500/20 text-[8px] text-purple-300 font-bold uppercase tracking-tighter px-2 py-0.5 rounded-full border border-purple-500/30">
                                                        Simulation Mode
                                                    </span>
                                                </motion.div>
                                            )}
                                        </div>

                                        <div className="space-y-4 p-5 bg-white/5 rounded-3xl border border-white/5">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm font-bold text-white/60">Apply Watermark</span>
                                                <input
                                                    type="checkbox"
                                                    checked={batchOptions.watermark.enabled}
                                                    onChange={e => setBatchOptions(prev => ({ ...prev, watermark: { ...prev.watermark, enabled: e.target.checked } }))}
                                                    className="w-5 h-5 rounded border-white/20 bg-black/20 text-purple-600 focus:ring-purple-500/50"
                                                />
                                            </div>

                                            <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 transition-opacity duration-300 ${batchOptions.watermark.enabled ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                                                <div>
                                                    <label className="block text-[10px] text-white/40 font-bold uppercase mb-1.5 ml-1">Position</label>
                                                    <select
                                                        value={batchOptions.watermark.position}
                                                        onChange={e => setBatchOptions(prev => ({ ...prev, watermark: { ...prev.watermark, position: e.target.value } }))}
                                                        className="glass-select !rounded-2xl !py-2.5 !text-sm w-full"
                                                    >
                                                        <option value="top">Top</option>
                                                        <option value="center">Center</option>
                                                        <option value="bottom">Bottom</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] text-white/40 font-bold uppercase mb-1.5 ml-1">Color</label>
                                                    <select
                                                        value={batchOptions.watermark.color}
                                                        onChange={e => setBatchOptions(prev => ({ ...prev, watermark: { ...prev.watermark, color: e.target.value } }))}
                                                        className="glass-select !rounded-2xl !py-2.5 !text-sm w-full"
                                                    >
                                                        <option value="yellow">Yellow</option>
                                                        <option value="white">White</option>
                                                        <option value="red">Red</option>
                                                        <option value="black">Black</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* RIGHT: Data Fields Section */}
                                    <div className="flex-1 space-y-5">
                                        <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-4 mb-2">
                                            <p className="text-xs text-purple-200">
                                                <strong>Smart Rule:</strong> Existing data will be preserved.
                                                Default values below will only be applied where metadata is missing.
                                                <br /><span className="text-white/40 italic">Title will be auto-branded with " - SumanOnline.Com"</span>
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-white/50 ml-1">Default Artists</label>
                                                <input type="text" placeholder="Artists Name" value={batchOptions.metadata.artist} onChange={e => handleOptionChange('artist', e.target.value)} className="glass-input !rounded-2xl" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-white/50 ml-1">Default Album</label>
                                                <input type="text" placeholder="Album Name" value={batchOptions.metadata.album} onChange={e => handleOptionChange('album', e.target.value)} className="glass-input !rounded-2xl" />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-white/50 ml-1">Default Genre</label>
                                                <input type="text" placeholder="Genre" value={batchOptions.metadata.genre} onChange={e => handleOptionChange('genre', e.target.value)} className="glass-input !rounded-2xl" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-white/50 ml-1">Default Year</label>
                                                <input type="text" placeholder="Year" value={batchOptions.metadata.year} onChange={e => handleOptionChange('year', e.target.value)} className="glass-input !rounded-2xl" />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-white/50 ml-1">Default Track</label>
                                                <input type="text" placeholder="Track Number" value={batchOptions.metadata.track} onChange={e => handleOptionChange('track', e.target.value)} className="glass-input !rounded-2xl" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-white/50 ml-1">Default Album Artist</label>
                                                <input type="text" placeholder="Album Artist" value={batchOptions.metadata.albumArtist} onChange={e => handleOptionChange('albumArtist', e.target.value)} className="glass-input !rounded-2xl" />
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-white/50 ml-1">Default Comment</label>
                                            <input type="text" placeholder="Comment" value={batchOptions.metadata.comment} onChange={e => handleOptionChange('comment', e.target.value)} className="glass-input !rounded-2xl" />
                                        </div>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                {isProcessing && (
                                    <div className="mt-8 space-y-2">
                                        <div className="flex justify-between text-xs font-bold mb-1">
                                            <span className="text-purple-400">Processing Batch...</span>
                                            <span className="text-white/40">{progress}%</span>
                                        </div>
                                        <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                                            <motion.div
                                                className="bg-gradient-to-r from-purple-500 to-pink-500 h-full"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${progress}%` }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Fixed Modal Footer */}
                            <div className="p-6 md:p-8 border-t border-white/5 bg-black/20 flex flex-col sm:flex-row gap-4 items-center justify-end flex-shrink-0">
                                <button
                                    onClick={() => !isProcessing && setShowModal(false)}
                                    disabled={isProcessing}
                                    className="w-full sm:w-auto px-8 py-4 glass-button rounded-2xl font-bold transition-all hover:bg-white/10"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => startBatchProcess('upload')}
                                    disabled={isProcessing}
                                    className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                                >
                                    {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Share2 className="w-5 h-5" />}
                                    Upload & Share
                                </button>
                                <button
                                    onClick={() => startBatchProcess('download')}
                                    disabled={isProcessing}
                                    className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-2xl font-bold shadow-lg shadow-purple-500/20 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                                >
                                    {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                    {window.innerWidth < 640 ? 'Download' : 'Save & Download'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default BatchMetadataEditor;
