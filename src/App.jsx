import React, { useState, useRef, useEffect } from 'react';
import {
  ClipboardCheck, ClipboardList, AlertTriangle, Bug, Leaf, Settings,
  Plus, ArrowLeft, MapPin, Trash2, Camera, Flag, Pencil, ChevronDown,
  ChevronRight, Download, RefreshCw, Save, X, Calendar as CalendarIcon,
  List as ListIcon, Clock, CheckCircle2, PlayCircle, Image as ImageIcon,
  Minus, ThumbsUp
} from 'lucide-react';
import { loadRecords, saveRecords } from './storage';

/* ---------------------------------------------------------------
   Shared constants
--------------------------------------------------------------- */

const MODULES = {
  qa: { label: 'QA', fullLabel: 'Quality assessment', icon: ClipboardCheck, color: '#0F6E56', bg: '#E1F5EE', text: '#085041' },
  sa: { label: 'SA', fullLabel: 'Site audit', icon: ClipboardList, color: '#185FA5', bg: '#E6F1FB', text: '#0C447C' },
  ra: { label: 'RA', fullLabel: 'Risk assessment', icon: AlertTriangle, color: '#854F0B', bg: '#FAEEDA', text: '#633806' },
  pest: { label: 'Pest ID', fullLabel: 'Pest identification & control', icon: Bug, color: '#A32D2D', bg: '#FCEBEB', text: '#791F1F' },
  plantscore: { label: 'PlantScore', fullLabel: 'Plant & display scoring', icon: Leaf, color: '#5F5E5A', bg: '#F1EFE8', text: '#444441' },
};

const RATINGS = ['Excellent', 'Good', 'Fair', 'Below standard'];

const RATING_STYLES = {
  Excellent: 'bg-green-50 text-green-700 border-green-300',
  Good: 'bg-blue-50 text-blue-700 border-blue-300',
  Fair: 'bg-amber-50 text-amber-700 border-amber-300',
  'Below standard': 'bg-red-50 text-red-700 border-red-300',
  Yes: 'bg-slate-100 text-slate-700 border-slate-300',
  No: 'bg-slate-100 text-slate-700 border-slate-300',
};

const RATING_PILL_ACTIVE = {
  Excellent: 'bg-green-600 text-white border-green-600',
  Good: 'bg-blue-600 text-white border-blue-600',
  Fair: 'bg-amber-500 text-white border-amber-500',
  'Below standard': 'bg-red-600 text-white border-red-600',
  Yes: 'bg-slate-600 text-white border-slate-600',
  No: 'bg-slate-600 text-white border-slate-600',
};

const CATEGORIES = [
  {
    id: 'plantHealth',
    label: 'Plant health',
    icon: Leaf,
    paragraphs: {
      Excellent: 'Plants are in excellent health, displaying strong turgidity, good vigour and healthy leaf colour throughout. No signs of stress, yellowing or dieback were observed.',
      Good: 'Plants are generally healthy with good turgidity and vigour. Minor yellowing was noted on isolated specimens, but overall vitality remains satisfactory.',
      Fair: 'Plant health is fair, with some specimens showing reduced vigour, yellowing or early signs of stress. Closer monitoring and remedial care is recommended.',
      'Below standard': 'Plant health is below standard, with multiple specimens showing wilting, significant yellowing, leaf drop or dieback. Remedial action is required to restore plant condition.',
    },
  },
  {
    id: 'containers',
    label: 'Container condition',
    icon: ClipboardList,
    paragraphs: {
      Excellent: 'Containers are clean, well-presented and in excellent condition, with no visible damage, staining or residue.',
      Good: 'Containers are generally clean and presentable, with only minor marks or residue noted that do not significantly affect appearance.',
      Fair: 'Container condition is fair. Some containers show visible staining, residue or minor damage and would benefit from cleaning or attention.',
      'Below standard': 'Container condition is below standard. Multiple containers show significant staining, residue, damage or are in need of replacement.',
    },
  },
  {
    id: 'soil',
    label: 'Soil / Vulkaponic condition',
    icon: ClipboardList,
    paragraphs: {
      Excellent: 'Growing medium condition is excellent, with appropriate moisture levels, good structure and no signs of compaction, waterlogging or nutrient deficiency.',
      Good: 'Growing medium condition is good overall, with adequate moisture and structure. Minor adjustments to watering or feeding may be beneficial.',
      Fair: 'Growing medium condition is fair. Some areas show signs of compaction, drying out or poor structure, and would benefit from attention.',
      'Below standard': 'Growing medium condition is below standard, with notable issues such as compaction, waterlogging, drying out or visible root disturbance. Remedial action is required.',
    },
  },
  {
    id: 'pests',
    label: 'Signs of pests',
    icon: Bug,
    paragraphs: {
      Excellent: 'No signs of pests or disease were identified. Foliage and stems are clear of infestation, and plants show no symptoms of pest-related damage.',
      Good: 'No significant pest activity was identified. Very minor, isolated signs were noted but do not currently require treatment.',
      Fair: 'Some signs of pest activity were identified, including isolated infestations or early symptoms of disease. Treatment is recommended to prevent further spread.',
      'Below standard': 'Pest or disease activity is evident across multiple plants. Treatment is required as a priority to prevent further spread and plant decline.',
    },
  },
  {
    id: 'dust',
    label: 'Dust on leaves',
    icon: ClipboardList,
    paragraphs: {
      Excellent: 'Foliage is clean and free from dust, with leaves displaying a healthy sheen throughout.',
      Good: 'Foliage is generally clean, with only light dust accumulation noted on a small number of leaves.',
      Fair: 'Dust accumulation is noticeable on a number of plants. Leaf cleaning is recommended to restore presentation and plant health.',
      'Below standard': 'Dust accumulation is significant across multiple plants, affecting appearance and potentially plant health. Leaf cleaning is required as a priority.',
    },
  },
  {
    id: 'display',
    label: 'Display quality',
    icon: ClipboardList,
    paragraphs: {
      Excellent: 'Display quality is excellent. Plants are well pruned with a neat, balanced appearance, top dressing is neat and presentable, and there are no noticeable gaps in the display.',
      Good: 'Display quality is good overall. Plants are generally well maintained with a tidy, balanced appearance, top dressing is in good condition, and there are no significant gaps in the display. Minor refinements would further enhance presentation.',
      Fair: 'Display quality is fair. Some plants are becoming overgrown or have an untidy, unbalanced appearance and would benefit from pruning, and some gaps in the display are noticeable and affect overall presentation.',
      'Below standard': 'Display quality is below standard. Plants are overgrown with an untidy, unbalanced appearance and require pruning, top dressing is patchy or missing in places, and noticeable gaps in the display are affecting the overall aesthetic.',
    },
  },
];

// Health & safety check — rendered as its own card after Replacements,
// not as part of the main CATEGORIES list.
const HAZARD_CATEGORY = {
  id: 'hazards',
  label: 'Health & safety',
  icon: AlertTriangle,
  type: 'yesno',
  question: 'Are there any hazards not included in RAMs?',
  paragraphs: {
    No: 'No hazards were identified beyond those already covered in the existing Risk Assessment Method Statement (RAMs).',
    Yes: 'A hazard was identified that is not currently covered in the existing Risk Assessment Method Statement (RAMs) and requires attention.',
  },
};

/* ---------------------------------------------------------------
   Helpers
--------------------------------------------------------------- */

function formatDateUK(iso) {
  if (!iso) return '-';
  const parts = iso.split('-');
  if (parts.length !== 3) return iso;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function relativeDate(iso) {
  if (!iso) return '';
  const today = new Date();
  const d = new Date(iso + 'T00:00:00');
  const diffDays = Math.round((d - new Date(today.getFullYear(), today.getMonth(), today.getDate())) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  if (diffDays > 1 && diffDays < 7) return `In ${diffDays} days`;
  if (diffDays < -1 && diffDays > -7) return `${Math.abs(diffDays)} days ago`;
  return formatDateUK(iso);
}

function newZone(name) {
  const categories = {};
  CATEGORIES.forEach((c) => {
    categories[c.id] = { rating: null, feedback: '', notes: '', photos: [] };
  });
  categories[HAZARD_CATEGORY.id] = { rating: null, feedback: '', notes: '', photos: [] };
  return {
    id: `zone-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    name,
    categories,
    replacements: { count: 0, notes: '', photos: [] },
    summary: '',
  };
}

function generateSummary(zone) {
  const parts = [];
  CATEGORIES.forEach((c) => {
    const entry = zone.categories[c.id];
    if (entry && entry.rating) {
      let text = entry.feedback || c.paragraphs[entry.rating];
      if (entry.notes && entry.notes.trim()) {
        text += ` ${entry.notes.trim()}`;
      }
      parts.push(text);
    }
  });
  if (zone.replacements && zone.replacements.count > 0) {
    let text = `${zone.replacements.count} plant${zone.replacements.count === 1 ? '' : 's'} ${zone.replacements.count === 1 ? 'has' : 'have'} been identified as requiring replacement in this zone.`;
    if (zone.replacements.notes && zone.replacements.notes.trim()) {
      text += ` ${zone.replacements.notes.trim()}`;
    }
    parts.push(text);
  }
  const hazardEntry = zone.categories[HAZARD_CATEGORY.id];
  if (hazardEntry && hazardEntry.rating) {
    let text = hazardEntry.feedback || HAZARD_CATEGORY.paragraphs[hazardEntry.rating];
    if (hazardEntry.notes && hazardEntry.notes.trim()) {
      text += ` ${hazardEntry.notes.trim()}`;
    }
    parts.push(text);
  }
  if (parts.length === 0) {
    return 'No categories have been assessed in this zone yet.';
  }
  return parts.join('\n\n');
}

function ratingCounts(zone) {
  const counts = { Excellent: 0, Good: 0, Fair: 0, 'Below standard': 0 };
  CATEGORIES.forEach((c) => {
    const entry = zone.categories[c.id];
    if (entry && entry.rating) counts[entry.rating] += 1;
  });
  return counts;
}

function totalRatingCounts(zones) {
  const totals = { Excellent: 0, Good: 0, Fair: 0, 'Below standard': 0 };
  zones.forEach((z) => {
    const c = ratingCounts(z);
    RATINGS.forEach((r) => { totals[r] += c[r]; });
  });
  return totals;
}

const OVERALL_DESC = {
  Excellent: 'an excellent standard overall, with plants, displays and maintenance well presented across the site',
  Good: 'a good standard overall, with only minor points noted across the site',
  Fair: 'a fair standard overall, with a number of areas across the site that would benefit from attention',
  'Below standard': 'below the expected standard overall, with significant attention required across multiple areas of the site',
};

function generateOverallSummary(zones, siteName) {
  if (zones.length === 0) return 'No zones have been added yet.';
  let assessed = 0;
  const totals = { Excellent: 0, Good: 0, Fair: 0, 'Below standard': 0 };
  const below = [];
  const fair = [];
  const hazardZones = [];
  let totalReplacements = 0;
  const replacementZones = [];
  zones.forEach((z) => {
    CATEGORIES.forEach((c) => {
      const e = z.categories[c.id];
      if (!e.rating) return;
      totals[e.rating]++;
      assessed++;
      if (e.rating === 'Below standard') below.push(`${z.name} (${c.label})`);
      if (e.rating === 'Fair') fair.push(`${z.name} (${c.label})`);
    });
    const hazardEntry = z.categories[HAZARD_CATEGORY.id];
    if (hazardEntry && hazardEntry.rating === 'Yes') hazardZones.push(z.name);
    if (z.replacements && z.replacements.count > 0) {
      totalReplacements += z.replacements.count;
      replacementZones.push(`${z.name} (${z.replacements.count})`);
    }
  });
  if (assessed === 0 && totalReplacements === 0 && hazardZones.length === 0) return `No categories have been assessed yet across the ${zones.length} zone${zones.length === 1 ? '' : 's'} covered.`;

  let dominant = 'Good';
  let max = -1;
  RATINGS.forEach((r) => { if (totals[r] > max) { max = totals[r]; dominant = r; } });

  const siteLabel = siteName ? ` at ${siteName}` : '';
  let text = `This assessment covered ${zones.length} zone${zones.length === 1 ? '' : 's'}${siteLabel}. Overall, conditions were assessed as ${OVERALL_DESC[dominant]}.`;

  if (hazardZones.length > 0) {
    text += ` Hazards not covered by the existing RAMs were identified in: ${hazardZones.join(', ')}.`;
  }
  if (below.length > 0) {
    text += ` The following require priority attention: ${below.join(', ')}.`;
  }
  if (fair.length > 0) {
    text += ` Additional areas noted as fair and worth monitoring: ${fair.join(', ')}.`;
  }
  if (below.length === 0 && fair.length === 0 && totalReplacements === 0 && hazardZones.length === 0) {
    text += ' No significant issues were identified across the site.';
  }
  if (totalReplacements > 0) {
    text += ` A total of ${totalReplacements} plant${totalReplacements === 1 ? '' : 's'} ${totalReplacements === 1 ? 'has' : 'have'} been identified as requiring replacement: ${replacementZones.join(', ')}.`;
  }
  return text;
}

// Per-category short action phrases, used to build auto-generated action points.
const ACTION_PHRASES = {
  plantHealth: 'Address plant health issues (wilting, yellowing or dieback)',
  containers: 'Clean or replace containers showing staining, residue or damage',
  soil: 'Attend to growing medium issues (compaction, watering, drainage)',
  pests: 'Treat pest or disease activity identified',
  dust: 'Clean dust from foliage',
  display: 'Prune overgrown growth and tidy the display, including top dressing and gaps',
};

// Builds a starting list of bulleted action points based on Fair / Below
// standard ratings (prioritising "Below standard") and replacement counts.
// Returns an array of plain-text strings.
function generateActionPoints(zones) {
  const hazards = [];
  const below = [];
  const fair = [];
  const replacements = [];

  zones.forEach((z) => {
    CATEGORIES.forEach((c) => {
      const e = z.categories[c.id];
      if (e.rating === 'Below standard') {
        below.push(`${z.name}: ${ACTION_PHRASES[c.id]}`);
      } else if (e.rating === 'Fair') {
        fair.push(`${z.name}: ${ACTION_PHRASES[c.id]}`);
      }
    });
    const hazardEntry = z.categories[HAZARD_CATEGORY.id];
    if (hazardEntry && hazardEntry.rating === 'Yes') {
      const detail = hazardEntry.notes && hazardEntry.notes.trim() ? `: ${hazardEntry.notes.trim()}` : '';
      hazards.push(`${z.name}: Hazard not covered by RAMs identified${detail}`);
    }
    if (z.replacements && z.replacements.count > 0) {
      const n = z.replacements.count;
      replacements.push(`${z.name}: replace ${n} plant${n === 1 ? '' : 's'}${z.replacements.notes ? ` (${z.replacements.notes.trim()})` : ''}`);
    }
  });

  // Hazards first (highest priority), then below standard, then replacements, then fair.
  return [...hazards, ...below, ...replacements, ...fair];
}

function zoneProgress(zone) {
  let done = 0;
  CATEGORIES.forEach((c) => {
    if (zone.categories[c.id] && zone.categories[c.id].rating) done += 1;
  });
  return done;
}

// Reads an image file and re-encodes it via canvas as a JPEG data URL,
// downscaling to a max dimension to keep memory and storage use reasonable.
//
// Modern browsers already decode <img>/createImageBitmap with EXIF
// orientation applied automatically — img.width/height and the pixels drawn
// via ctx.drawImage() are already "upright". Re-encoding through canvas
// simply strips the EXIF block, which avoids jsPDF (which does NOT honour
// EXIF orientation when embedding images) re-applying a rotation that the
// browser has already accounted for.
const MAX_PHOTO_DIMENSION = 1600;
const PHOTO_JPEG_QUALITY = 0.8;

function readFileAsImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > MAX_PHOTO_DIMENSION || height > MAX_PHOTO_DIMENSION) {
          const scale = MAX_PHOTO_DIMENSION / Math.max(width, height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve({
          src: canvas.toDataURL('image/jpeg', PHOTO_JPEG_QUALITY),
          width,
          height,
        });
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function newQARecord(overrides = {}) {
  return {
    id: `qa-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    module: 'qa',
    status: 'scheduled', // scheduled | in_progress | completed
    siteInfo: {
      client: '',
      site: '',
      address: '',
      technicians: '',
      lastService: '',
      inspector: '',
      date: new Date().toISOString().slice(0, 10),
    },
    zones: [],
    overallSummary: '',
    actionPoints: [],
    ...overrides,
  };
}

/* ---------------------------------------------------------------
   Photo annotation modal
--------------------------------------------------------------- */

function AnnotatorModal({ photo, onSave, onClose }) {
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
    };
    img.src = photo.src;
  }, [photo]);

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
  };

  const start = (e) => {
    e.preventDefault();
    drawingRef.current = true;
    const ctx = canvasRef.current.getContext('2d');
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };
  const move = (e) => {
    if (!drawingRef.current) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = Math.max(4, canvas.width / 120);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  };
  const end = () => { drawingRef.current = false; };

  const clearDrawing = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
    img.src = photo.src;
  };

  const save = () => {
    const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.85);
    onSave(dataUrl);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full p-4 max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-medium text-slate-800">Mark up issue</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>
        <p className="text-xs text-slate-500 mb-2">Draw on the photo to highlight the issue area.</p>
        <div className="border border-slate-200 rounded-lg overflow-hidden mb-3 bg-slate-50">
          <canvas
            ref={canvasRef}
            className="w-full h-auto touch-none cursor-crosshair block"
            onMouseDown={start}
            onMouseMove={move}
            onMouseUp={end}
            onMouseLeave={end}
            onTouchStart={start}
            onTouchMove={move}
            onTouchEnd={end}
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={clearDrawing}
            className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
          >
            Clear marks
          </button>
          <button
            onClick={save}
            className="flex-1 px-3 py-2 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center justify-center gap-1.5"
          >
            <Save size={15} /> Save markup
          </button>
        </div>
      </div>
    </div>
  );
}

function PhotoThumb({ photo, onAnnotate, onFlagIssue, onFlagGood, onRemove, readOnly }) {
  const flagType = photo.flagType || null;
  return (
    <div className="flex-shrink-0 w-28">
      <div className="relative w-28 h-28 rounded-lg border border-slate-200 overflow-hidden bg-slate-50">
        <img src={photo.annotatedSrc || photo.src} alt="" className="w-full h-full object-cover" />
        {flagType === 'issue' && (
          <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-red-500 border border-white flex items-center justify-center">
            <Flag size={11} className="text-white" />
          </div>
        )}
        {flagType === 'good' && (
          <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-green-500 border border-white flex items-center justify-center">
            <ThumbsUp size={11} className="text-white" />
          </div>
        )}
      </div>
      {!readOnly && (
        <div className="grid grid-cols-2 gap-1 mt-1.5">
          <button
            onClick={onAnnotate}
            title="Draw on photo"
            aria-label="Draw on photo"
            className="flex items-center justify-center py-1.5 rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 active:bg-slate-100"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={onRemove}
            title="Remove photo"
            aria-label="Remove photo"
            className="flex items-center justify-center py-1.5 rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 active:bg-slate-100"
          >
            <Trash2 size={15} />
          </button>
          <button
            onClick={onFlagIssue}
            title="Flag as issue"
            aria-label="Flag as issue"
            className={`flex items-center justify-center gap-1 py-1.5 rounded-md border text-xs active:bg-slate-100 ${
              flagType === 'issue' ? 'border-red-300 text-red-600 bg-red-50' : 'border-slate-200 text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Flag size={13} /> Issue
          </button>
          <button
            onClick={onFlagGood}
            title="Flag as good practice"
            aria-label="Flag as good practice"
            className={`flex items-center justify-center gap-1 py-1.5 rounded-md border text-xs active:bg-slate-100 ${
              flagType === 'good' ? 'border-green-300 text-green-600 bg-green-50' : 'border-slate-200 text-slate-500 hover:bg-slate-50'
            }`}
          >
            <ThumbsUp size={13} /> Good
          </button>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------
   Category card (QA assessment)
--------------------------------------------------------------- */

function CategoryCard({ category, entry, expanded, onToggle, onRate, onFeedbackChange, onNotesChange, onAddPhotos, onAnnotate, onSetFlag, onRemovePhoto, onCaptionChange, readOnly }) {
  const Icon = category.icon;
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  return (
    <div className="border border-slate-200 rounded-xl bg-white overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-medium text-slate-800">
          <Icon size={16} className="text-slate-500" />
          {category.label}
        </span>
        <span className="flex items-center gap-2">
          {entry.photos.length > 0 && (
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Camera size={13} /> {entry.photos.length}
            </span>
          )}
          {entry.rating ? (
            <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${RATING_STYLES[entry.rating]}`}>
              {entry.rating}
            </span>
          ) : (
            <span className="text-xs font-medium px-2.5 py-0.5 rounded-full border bg-slate-50 text-slate-400 border-slate-200">
              Pending
            </span>
          )}
          {expanded ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
        </span>
      </button>

      {expanded && (
        <div className="border-t border-slate-100 px-4 py-3 space-y-3">
          {category.type === 'yesno' ? (
            <>
              <p className="text-sm text-slate-700">{category.question}</p>
              <div className="grid grid-cols-2 gap-2">
                {['No', 'Yes'].map((r) => (
                  <button
                    key={r}
                    onClick={() => onRate(r)}
                    disabled={readOnly}
                    className={`text-sm py-2 rounded-lg border transition-colors ${
                      entry.rating === r
                        ? 'border-slate-400 bg-slate-100 text-slate-800 font-medium'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    } ${readOnly ? 'opacity-60 cursor-default' : ''}`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {RATINGS.map((r) => (
                <button
                  key={r}
                  onClick={() => onRate(r)}
                  disabled={readOnly}
                  className={`text-sm py-2 rounded-lg border transition-colors ${
                    entry.rating === r ? RATING_PILL_ACTIVE[r] : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  } ${readOnly ? 'opacity-60 cursor-default' : ''}`}
                >
                  {r}
                </button>
              ))}
            </div>
          )}

          {entry.rating && (category.type !== 'yesno' || entry.rating === 'Yes') && (
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">
                Auto-generated feedback
              </p>
              <textarea
                value={entry.feedback}
                onChange={(e) => onFeedbackChange(e.target.value)}
                rows={3}
                readOnly={readOnly}
                className="w-full text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-2.5 resize-none focus:outline-none focus:ring-1 focus:ring-teal-400"
              />
            </div>
          )}

          {(category.type !== 'yesno' || entry.rating === 'Yes') && (
            <>
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">
                  {category.type === 'yesno' ? 'Hazard details' : 'Additional notes'}
                </p>
                <textarea
                  value={entry.notes}
                  onChange={(e) => onNotesChange(e.target.value)}
                  rows={2}
                  placeholder={category.type === 'yesno' ? 'Describe the hazard...' : 'Add site-specific observations...'}
                  readOnly={readOnly}
                  className="w-full text-sm text-slate-700 border border-slate-200 rounded-lg p-2.5 resize-none focus:outline-none focus:ring-1 focus:ring-teal-400"
                />
              </div>

              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1.5">Photos</p>
                <div className="flex flex-col gap-3">
                  {entry.photos.map((photo) => (
                    <div key={photo.id} className="flex gap-3">
                      <PhotoThumb
                        photo={photo}
                        onAnnotate={() => onAnnotate(photo)}
                        onFlagIssue={() => onSetFlag(photo.id, 'issue')}
                        onFlagGood={() => onSetFlag(photo.id, 'good')}
                        onRemove={() => onRemovePhoto(photo.id)}
                        readOnly={readOnly}
                      />
                      <input
                        type="text"
                        value={photo.caption || ''}
                        onChange={(e) => onCaptionChange(photo.id, e.target.value)}
                        placeholder="Caption (optional)"
                        readOnly={readOnly}
                        className="flex-1 self-start text-sm border border-slate-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-teal-400"
                      />
                    </div>
                  ))}
                  {!readOnly && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => cameraInputRef.current.click()}
                        className="flex-1 flex items-center justify-center gap-2 text-sm text-slate-500 border border-dashed border-slate-300 rounded-lg py-2 hover:bg-slate-50"
                      >
                        <Camera size={16} /> Take photo
                      </button>
                      <button
                        onClick={() => galleryInputRef.current.click()}
                        className="flex-1 flex items-center justify-center gap-2 text-sm text-slate-500 border border-dashed border-slate-300 rounded-lg py-2 hover:bg-slate-50"
                      >
                        <ImageIcon size={16} /> Upload
                      </button>
                    </div>
                  )}
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    capture="environment"
                    className="hidden"
                    onChange={(e) => {
                      onAddPhotos(e.target.files);
                      e.target.value = '';
                    }}
                  />
                  <input
                    ref={galleryInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      onAddPhotos(e.target.files);
                      e.target.value = '';
                    }}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------
   Replacements card
--------------------------------------------------------------- */

function ReplacementsCard({ replacements, expanded, onToggle, onCountChange, onNotesChange, onAddPhotos, onAnnotate, onSetFlag, onRemovePhoto, onCaptionChange, readOnly }) {
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  return (
    <div className="border border-slate-200 rounded-xl bg-white overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-medium text-slate-800">
          <RefreshCw size={16} className="text-slate-500" />
          Replacements
        </span>
        <span className="flex items-center gap-2">
          {replacements.photos.length > 0 && (
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Camera size={13} /> {replacements.photos.length}
            </span>
          )}
          {replacements.count > 0 ? (
            <span className="text-xs font-medium px-2.5 py-0.5 rounded-full border bg-red-50 text-red-700 border-red-300">
              {replacements.count} required
            </span>
          ) : (
            <span className="text-xs font-medium px-2.5 py-0.5 rounded-full border bg-slate-50 text-slate-400 border-slate-200">
              None
            </span>
          )}
          {expanded ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
        </span>
      </button>

      {expanded && (
        <div className="border-t border-slate-100 px-4 py-3 space-y-3">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">
              Number of replacements required
            </p>
            <div className="flex items-center gap-2">
              {!readOnly && (
                <button
                  onClick={() => onCountChange(Math.max(0, (replacements.count || 0) - 1))}
                  aria-label="Decrease replacements count"
                  className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 active:bg-slate-100 flex-shrink-0"
                >
                  <Minus size={16} />
                </button>
              )}
              <input
                type="number"
                min="0"
                value={replacements.count}
                onChange={(e) => onCountChange(Math.max(0, parseInt(e.target.value, 10) || 0))}
                readOnly={readOnly}
                className="flex-1 text-sm text-center text-slate-700 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-teal-400"
              />
              {!readOnly && (
                <button
                  onClick={() => onCountChange((replacements.count || 0) + 1)}
                  aria-label="Increase replacements count"
                  className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 active:bg-slate-100 flex-shrink-0"
                >
                  <Plus size={16} />
                </button>
              )}
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">
              Notes
            </p>
            <textarea
              value={replacements.notes}
              onChange={(e) => onNotesChange(e.target.value)}
              rows={2}
              placeholder="E.g. species affected, location within zone, suggested replacements..."
              readOnly={readOnly}
              className="w-full text-sm text-slate-700 border border-slate-200 rounded-lg p-2.5 resize-none focus:outline-none focus:ring-1 focus:ring-teal-400"
            />
          </div>

          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1.5">Photos</p>
            <div className="flex flex-col gap-3">
              {replacements.photos.map((photo) => (
                <div key={photo.id} className="flex gap-3">
                  <PhotoThumb
                    photo={photo}
                    onAnnotate={() => onAnnotate(photo)}
                    onFlagIssue={() => onSetFlag(photo.id, 'issue')}
                    onFlagGood={() => onSetFlag(photo.id, 'good')}
                    onRemove={() => onRemovePhoto(photo.id)}
                    readOnly={readOnly}
                  />
                  <input
                    type="text"
                    value={photo.caption || ''}
                    onChange={(e) => onCaptionChange(photo.id, e.target.value)}
                    placeholder="Caption (optional)"
                    readOnly={readOnly}
                    className="flex-1 self-start text-sm border border-slate-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-teal-400"
                  />
                </div>
              ))}
              {!readOnly && (
                <div className="flex gap-2">
                  <button
                    onClick={() => cameraInputRef.current.click()}
                    className="flex-1 flex items-center justify-center gap-2 text-sm text-slate-500 border border-dashed border-slate-300 rounded-lg py-2 hover:bg-slate-50"
                  >
                    <Camera size={16} /> Take photo
                  </button>
                  <button
                    onClick={() => galleryInputRef.current.click()}
                    className="flex-1 flex items-center justify-center gap-2 text-sm text-slate-500 border border-dashed border-slate-300 rounded-lg py-2 hover:bg-slate-50"
                  >
                    <ImageIcon size={16} /> Upload
                  </button>
                </div>
              )}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                multiple
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  onAddPhotos(e.target.files);
                  e.target.value = '';
                }}
              />
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  onAddPhotos(e.target.files);
                  e.target.value = '';
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------
   PDF export
--------------------------------------------------------------- */

function loadJsPDF() {
  return import('jspdf').then((mod) => mod.jsPDF);
}

const ACCENT = [15, 110, 86];
const PDF_COLORS = {
  Excellent: [22, 163, 74],
  Good: [37, 99, 235],
  Fair: [217, 119, 6],
  'Below standard': [220, 38, 38],
  'Not assessed': [148, 163, 184],
  Yes: [100, 116, 139],
  No: [100, 116, 139],
};

async function exportQAPdf(record) {
  const jsPDF = await loadJsPDF();
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = 210;
  const pageH = 297;
  const margin = 16;
  let y = margin;
  const { siteInfo, zones } = record;

  const addHeaderBar = (title) => {
    doc.setFillColor(...ACCENT);
    doc.rect(0, 0, pageW, 14, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('HortiCheck', margin, 9);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(9);
    doc.text(title, pageW - margin, 9, { align: 'right' });
    doc.setTextColor(40, 40, 40);
    y = 24;
  };

  // Renders text split into paragraphs (on blank lines / \n\n), wrapping
  // each paragraph to the page width and adding extra vertical spacing
  // between paragraphs. Handles page breaks via addHeaderBar.
  const drawWrappedParagraphs = (text, headerTitle) => {
    const paragraphs = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
    paragraphs.forEach((paragraph, idx) => {
      const lines = doc.splitTextToSize(paragraph, pageW - margin * 2);
      lines.forEach((line) => {
        if (y > pageH - margin) {
          doc.addPage();
          addHeaderBar(headerTitle);
        }
        doc.text(line, margin, y);
        y += 5.5;
      });
      if (idx < paragraphs.length - 1) y += 2.5; // extra gap between paragraphs
    });
  };

  // Renders a bulleted list, wrapping each item to the page width (with a
  // hanging indent for wrapped lines) and handling page breaks.
  const drawBulletedList = (items, headerTitle) => {
    const bulletIndent = 5;
    items.forEach((item) => {
      const text = (item || '').trim();
      if (!text) return;
      const lines = doc.splitTextToSize(text, pageW - margin * 2 - bulletIndent);
      lines.forEach((line, i) => {
        if (y > pageH - margin) {
          doc.addPage();
          addHeaderBar(headerTitle);
        }
        if (i === 0) {
          doc.text('\u2022', margin, y);
        }
        doc.text(line, margin + bulletIndent, y);
        y += 5.5;
      });
    });
  };


  doc.setFillColor(...ACCENT);
  doc.rect(0, 0, pageW, 60, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont(undefined, 'bold');
  doc.text('HortiCheck', margin, 28);
  doc.setFontSize(12);
  doc.setFont(undefined, 'normal');
  doc.text('Quality assessment report', margin, 38);

  doc.setTextColor(40, 40, 40);
  y = 80;
  doc.setFontSize(11);
  const rows = [
    ['Client', siteInfo.client || '-'],
    ['Site', siteInfo.site || '-'],
    ['Address', siteInfo.address || '-'],
    ['Technician(s)', siteInfo.technicians || '-'],
    ['Last service', formatDateUK(siteInfo.lastService)],
    ['QA date', formatDateUK(siteInfo.date)],
    ['Inspector', siteInfo.inspector || '-'],
    ['Zones assessed', String(zones.length)],
  ];
  rows.forEach(([label, value]) => {
    doc.setFont(undefined, 'bold');
    doc.text(`${label}:`, margin, y);
    doc.setFont(undefined, 'normal');
    doc.text(String(value), margin + 38, y);
    y += 8;
  });

  y += 6;
  doc.setFont(undefined, 'bold');
  doc.setFontSize(12);
  doc.setTextColor(20, 20, 20);
  doc.text('Overall site summary', margin, y);
  y += 7;
  doc.setFont(undefined, 'normal');
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  const overallText = record.overallSummary || generateOverallSummary(zones, siteInfo.site);
  drawWrappedParagraphs(overallText, siteInfo.site || '');

  const actionPoints = (record.actionPoints && record.actionPoints.length > 0)
    ? record.actionPoints
    : generateActionPoints(zones);
  const actionPointItems = actionPoints.map((p) => (p || '').trim()).filter(Boolean);
  if (actionPointItems.length > 0) {
    y += 6;
    doc.setFont(undefined, 'bold');
    doc.setFontSize(12);
    doc.setTextColor(20, 20, 20);
    if (y > pageH - margin) {
      doc.addPage();
      addHeaderBar(siteInfo.site || '');
    }
    doc.text('Action points', margin, y);
    y += 7;
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    drawBulletedList(actionPointItems, siteInfo.site || '');
  }

  if (y < 255) {
    y += 8;
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.text('This report provides a qualitative overview of site, plant and maintenance', margin, y);
    doc.text('conditions at the time of inspection, with photographic evidence where relevant.', margin, y + 5);
  }

  zones.forEach((zone) => {
    doc.addPage();
    addHeaderBar(siteInfo.site || '');

    doc.setFontSize(15);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(20, 20, 20);
    doc.text(zone.name, margin, y);
    y += 8;

    doc.setFontSize(10);
    CATEGORIES.forEach((c) => {
      const entry = zone.categories[c.id];
      doc.setFont(undefined, 'normal');
      doc.setTextColor(60, 60, 60);
      doc.text(c.label, margin, y);
      const rating = entry.rating || 'Not assessed';
      const col = PDF_COLORS[rating];
      doc.setTextColor(...col);
      doc.setFont(undefined, 'bold');
      doc.text(rating, pageW - margin, y, { align: 'right' });
      y += 6;
    });

    if (zone.replacements && zone.replacements.count > 0) {
      doc.setFont(undefined, 'normal');
      doc.setTextColor(60, 60, 60);
      doc.text('Replacements required', margin, y);
      doc.setTextColor(...PDF_COLORS['Below standard']);
      doc.setFont(undefined, 'bold');
      doc.text(String(zone.replacements.count), pageW - margin, y, { align: 'right' });
      y += 6;
    }

    const hazardEntry = zone.categories[HAZARD_CATEGORY.id];
    if (hazardEntry && hazardEntry.rating) {
      doc.setFont(undefined, 'normal');
      doc.setTextColor(60, 60, 60);
      doc.text(HAZARD_CATEGORY.question, margin, y);
      doc.setTextColor(...PDF_COLORS[hazardEntry.rating]);
      doc.setFont(undefined, 'bold');
      doc.text(hazardEntry.rating, pageW - margin, y, { align: 'right' });
      y += 6;
    }

    y += 4;
    doc.setDrawColor(220, 220, 220);
    doc.line(margin, y, pageW - margin, y);
    y += 8;

    doc.setFont(undefined, 'bold');
    doc.setFontSize(11);
    doc.setTextColor(20, 20, 20);
    doc.text('Summary', margin, y);
    y += 6;
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    const summaryText = zone.summary || generateSummary(zone);
    drawWrappedParagraphs(summaryText, siteInfo.site || '');

    const issuePhotoEntries = [];
    const goodPracticeEntries = [];
    CATEGORIES.forEach((c) => {
      const entry = zone.categories[c.id];
      entry.photos.forEach((p) => {
        if (p.flagType === 'issue') issuePhotoEntries.push({ category: c.label, photo: p });
        else if (p.flagType === 'good') goodPracticeEntries.push({ category: c.label, photo: p });
      });
    });
    if (zone.replacements) {
      zone.replacements.photos.forEach((p) => {
        if (p.flagType === 'issue') issuePhotoEntries.push({ category: 'Replacements', photo: p });
        else if (p.flagType === 'good') goodPracticeEntries.push({ category: 'Replacements', photo: p });
      });
    }
    if (zone.categories[HAZARD_CATEGORY.id]) {
      zone.categories[HAZARD_CATEGORY.id].photos.forEach((p) => {
        if (p.flagType === 'issue') issuePhotoEntries.push({ category: HAZARD_CATEGORY.label, photo: p });
        else if (p.flagType === 'good') goodPracticeEntries.push({ category: HAZARD_CATEGORY.label, photo: p });
      });
    }

    // Renders a labelled photo gallery (grid of thumbnails with category + caption).
    const drawPhotoGallery = (heading, photoEntries) => {
      if (photoEntries.length === 0) return;
      y += 6;
      if (y > pageH - 60) {
        doc.addPage();
        addHeaderBar(siteInfo.site || '');
      }
      doc.setFont(undefined, 'bold');
      doc.setFontSize(11);
      doc.setTextColor(20, 20, 20);
      doc.text(heading, margin, y);
      y += 8;

      const imgW = 80;
      let x = margin;
      let rowMaxH = 0;

      photoEntries.forEach(({ category, photo }) => {
        const src = photo.annotatedSrc || photo.src;
        const ratio = photo.height && photo.width ? photo.height / photo.width : 0.75;
        const imgH = imgW * ratio;

        if (x + imgW > pageW - margin) {
          x = margin;
          y += rowMaxH + 16;
          rowMaxH = 0;
        }
        if (y + imgH + 12 > pageH - margin) {
          doc.addPage();
          addHeaderBar(siteInfo.site || '');
          x = margin;
          y = 24;
        }

        try {
          doc.addImage(src, 'JPEG', x, y, imgW, imgH);
        } catch (e) {
          // skip image if it fails to embed
        }
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.setFont(undefined, 'bold');
        doc.text(category, x, y + imgH + 4);
        if (photo.caption) {
          doc.setFont(undefined, 'normal');
          const capLines = doc.splitTextToSize(photo.caption, imgW);
          doc.text(capLines[0] || '', x, y + imgH + 8);
        }

        rowMaxH = Math.max(rowMaxH, imgH);
        x += imgW + 8;
      });

      y += rowMaxH + 16;
    };

    const hasGalleryContent = issuePhotoEntries.length > 0 || goodPracticeEntries.length > 0;
    if (hasGalleryContent) {
      doc.addPage();
      addHeaderBar(siteInfo.site || '');
    }

    drawPhotoGallery('Issues identified', issuePhotoEntries);
    drawPhotoGallery('Good practice examples', goodPracticeEntries);
  });

  doc.save(`HortiCheck_${(siteInfo.site || 'report').replace(/\s+/g, '_')}.pdf`);
}

/* ---------------------------------------------------------------
   Dashboard
--------------------------------------------------------------- */

function Dashboard({ records, onNewQA, onOpenRecord, onOpenModuleStub, onDeleteRecord }) {
  const [view, setView] = useState('list'); // list | calendar

  const scheduled = records.filter((r) => r.status === 'scheduled');
  const inProgress = records.filter((r) => r.status === 'in_progress');
  const completed = records.filter((r) => r.status === 'completed');

  const recentSorted = [...records].sort((a, b) => {
    const da = a.siteInfo?.date || '';
    const db = b.siteInfo?.date || '';
    return db.localeCompare(da);
  });

  const upcomingSorted = [...scheduled].sort((a, b) => (a.siteInfo?.date || '').localeCompare(b.siteInfo?.date || ''));

  // Build a simple month grid for the calendar view, centred on the earliest scheduled date or today
  const today = new Date();
  const baseDate = upcomingSorted.length > 0 ? new Date(upcomingSorted[0].siteInfo.date + 'T00:00:00') : today;
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const startWeekday = (firstOfMonth.getDay() + 6) % 7; // make Monday = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthLabel = baseDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

  const eventsByDate = {};
  scheduled.forEach((r) => {
    const d = r.siteInfo?.date;
    if (!d) return;
    if (!eventsByDate[d]) eventsByDate[d] = [];
    eventsByDate[d].push(r);
  });

  const calendarCells = [];
  for (let i = 0; i < startWeekday; i++) calendarCells.push(null);
  for (let day = 1; day <= daysInMonth; day++) calendarCells.push(day);

  const StatusPill = ({ status }) => {
    const map = {
      scheduled: { label: 'Scheduled', cls: 'bg-slate-100 text-slate-600' },
      in_progress: { label: 'In progress', cls: 'bg-amber-50 text-amber-700' },
      completed: { label: 'Completed', cls: 'bg-green-50 text-green-700' },
    };
    const s = map[status] || map.scheduled;
    return <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${s.cls}`}>{s.label}</span>;
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-teal-700 flex items-center justify-center text-teal-50">
            <ClipboardCheck size={18} />
          </div>
          <span className="text-lg font-medium text-slate-800">HortiCheck</span>
        </div>
        <Settings size={18} className="text-slate-400" />
      </div>

      <div className="grid grid-cols-3 gap-2.5 mb-6">
        <div className="bg-slate-50 rounded-lg p-3">
          <p className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Clock size={12} /> Scheduled</p>
          <p className="text-xl font-medium text-slate-700">{scheduled.length}</p>
        </div>
        <div className="bg-slate-50 rounded-lg p-3">
          <p className="text-xs text-slate-500 mb-1 flex items-center gap-1"><PlayCircle size={12} /> In progress</p>
          <p className="text-xl font-medium text-amber-600">{inProgress.length}</p>
        </div>
        <div className="bg-slate-50 rounded-lg p-3">
          <p className="text-xs text-slate-500 mb-1 flex items-center gap-1"><CheckCircle2 size={12} /> Completed</p>
          <p className="text-xl font-medium text-green-600">{completed.length}</p>
        </div>
      </div>

      <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2.5">New assessment</p>
      <div className="grid grid-cols-5 gap-2 mb-6">
        {Object.entries(MODULES).map(([key, mod]) => {
          const Icon = mod.icon;
          return (
            <button
              key={key}
              onClick={() => (key === 'qa' ? onNewQA() : onOpenModuleStub(key))}
              className="flex flex-col items-center gap-1.5 py-3 px-1 rounded-xl border border-slate-200 hover:border-slate-300 bg-white text-center"
            >
              <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: mod.bg, color: mod.text }}>
                <Icon size={17} />
              </div>
              <span className="text-[11px] font-medium text-slate-700">{mod.label}</span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between mb-2.5">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">
          {view === 'list' ? 'Upcoming & recent' : 'Schedule'}
        </p>
        <div className="flex border border-slate-200 rounded-lg overflow-hidden">
          <button
            onClick={() => setView('list')}
            className={`px-2 py-1 flex items-center gap-1 text-xs ${view === 'list' ? 'bg-teal-600 text-white' : 'bg-white text-slate-500'}`}
          >
            <ListIcon size={13} /> List
          </button>
          <button
            onClick={() => setView('calendar')}
            className={`px-2 py-1 flex items-center gap-1 text-xs ${view === 'calendar' ? 'bg-teal-600 text-white' : 'bg-white text-slate-500'}`}
          >
            <CalendarIcon size={13} /> Calendar
          </button>
        </div>
      </div>

      {view === 'list' && (
        <div className="space-y-2">
          {upcomingSorted.length > 0 && (
            <>
              <p className="text-[11px] text-slate-400 mt-1">Scheduled</p>
              {upcomingSorted.map((r) => {
                const mod = MODULES[r.module];
                const Icon = mod.icon;
                return (
                  <button
                    key={r.id}
                    onClick={() => onOpenRecord(r.id)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: mod.bg, color: mod.text }}>
                        <Icon size={14} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-800">{r.siteInfo.site || 'Untitled site'}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{mod.label} &middot; {r.zones.length} zone{r.zones.length === 1 ? '' : 's'} planned</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <StatusPill status={r.status} />
                      <p className="text-xs text-slate-400 mt-1">{relativeDate(r.siteInfo.date)}</p>
                    </div>
                  </button>
                );
              })}
            </>
          )}

          {recentSorted.filter((r) => r.status !== 'scheduled').length > 0 && (
            <>
              <p className="text-[11px] text-slate-400 mt-3">Recent activity</p>
              {recentSorted.filter((r) => r.status !== 'scheduled').map((r) => {
                const mod = MODULES[r.module];
                const Icon = mod.icon;
                const counts = ratingCounts({ categories: {} });
                const issues = r.zones.reduce((acc, z) => acc + ratingCounts(z)['Below standard'] + ratingCounts(z).Fair, 0);
                return (
                  <div
                    key={r.id}
                    className="w-full bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between text-left"
                  >
                    <button onClick={() => onOpenRecord(r.id)} className="flex items-center gap-3 text-left flex-1 min-w-0">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: mod.bg, color: mod.text }}>
                        <Icon size={14} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{r.siteInfo.site || 'Untitled site'}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {mod.label} &middot; {r.zones.length} zone{r.zones.length === 1 ? '' : 's'}
                          {issues > 0 ? ` \u00b7 ${issues} issue${issues === 1 ? '' : 's'} flagged` : ''}
                        </p>
                      </div>
                    </button>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={() => onOpenRecord(r.id)} className="text-right">
                        <StatusPill status={r.status} />
                        <p className="text-xs text-slate-400 mt-1">{relativeDate(r.siteInfo.date)}</p>
                      </button>
                      {r.status === 'completed' && (
                        <button
                          onClick={() => onDeleteRecord(r.id, r.siteInfo.site || 'Untitled site')}
                          aria-label="Delete assessment"
                          title="Delete assessment"
                          className="w-7 h-7 flex items-center justify-center rounded-md text-slate-300 hover:text-red-500 hover:bg-red-50 flex-shrink-0"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {records.length === 0 && (
            <div className="text-center text-sm text-slate-400 py-8 border border-dashed border-slate-200 rounded-xl">
              No assessments yet — tap QA above to get started
            </div>
          )}
        </div>
      )}

      {view === 'calendar' && (
        <div className="bg-white border border-slate-200 rounded-xl p-3">
          <p className="text-sm font-medium text-slate-700 mb-2 text-center">{monthLabel}</p>
          <div className="grid grid-cols-7 gap-1 mb-1">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
              <div key={d} className="text-[10px] text-center text-slate-400">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {calendarCells.map((day, idx) => {
              if (day === null) return <div key={idx} />;
              const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const events = eventsByDate[iso] || [];
              const isToday = iso === today.toISOString().slice(0, 10);
              return (
                <div
                  key={idx}
                  className={`text-center rounded-lg py-1.5 text-xs ${isToday ? 'bg-teal-50 text-teal-700 font-medium' : 'text-slate-600'} ${events.length > 0 ? 'border border-teal-200' : ''}`}
                >
                  {day}
                  {events.length > 0 && (
                    <div className="flex justify-center mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {upcomingSorted.length > 0 ? (
            <div className="mt-3 space-y-1.5">
              {upcomingSorted.map((r) => (
                <button
                  key={r.id}
                  onClick={() => onOpenRecord(r.id)}
                  className="w-full flex items-center justify-between text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-50 text-xs"
                >
                  <span className="text-slate-700">{r.siteInfo.site || 'Untitled site'}</span>
                  <span className="text-slate-400">{formatDateUK(r.siteInfo.date)}</span>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 text-center mt-3">No QAs scheduled</p>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------
   QA flow (setup / assess / summary / sitesummary / report)
--------------------------------------------------------------- */

function QAFlow({ record, onChange, onClose }) {
  const [screen, setScreen] = useState(record.status === 'scheduled' && record.zones.length === 0 ? 'setup' : 'assess');
  const [currentZoneIdx, setCurrentZoneIdx] = useState(0);
  const [expandedCat, setExpandedCat] = useState(null);
  const [annotating, setAnnotating] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [newZoneName, setNewZoneName] = useState('');
  const [addingZone, setAddingZone] = useState(false);
  const [pendingZoneName, setPendingZoneName] = useState('');
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  useEffect(() => {
    loadJsPDF().catch(() => {});
  }, []);

  const readOnly = record.status === 'completed';

  const update = (patch) => {
    if (readOnly) return;
    onChange({ ...record, ...patch });
  };

  const updateSiteInfo = (patch) => {
    update({ siteInfo: { ...record.siteInfo, ...patch } });
  };

  const updateZones = (zones) => {
    update({ zones });
  };

  const updateZone = (idx, updater) => {
    updateZones(record.zones.map((z, i) => (i === idx ? updater(z) : z)));
  };

  const updateCategory = (zoneIdx, catId, patch) => {
    updateZone(zoneIdx, (z) => ({
      ...z,
      categories: { ...z.categories, [catId]: { ...z.categories[catId], ...patch } },
    }));
  };

  const addZone = (name) => {
    const z = newZone(name || `Zone ${record.zones.length + 1}`);
    updateZones([...record.zones, z]);
    return z;
  };

  const addZoneAndSwitch = (name) => {
    addZone(name);
    setCurrentZoneIdx(record.zones.length); // length before push = new index
    setExpandedCat(null);
  };

  const removeZone = (idx) => {
    updateZones(record.zones.filter((_, i) => i !== idx));
  };

  const currentZone = record.zones[currentZoneIdx];

  const handleRate = (zoneIdx, catId, rating) => {
    const category = catId === HAZARD_CATEGORY.id ? HAZARD_CATEGORY : CATEGORIES.find((c) => c.id === catId);
    updateCategory(zoneIdx, catId, { rating, feedback: category.paragraphs[rating] });
    if (record.status === 'scheduled') update({ status: 'in_progress' });
  };

  const updateReplacements = (zoneIdx, patch) => {
    updateZone(zoneIdx, (z) => ({ ...z, replacements: { ...z.replacements, ...patch } }));
  };

  const handleAddPhotos = async (zoneIdx, catId, files) => {
    const newPhotos = [];
    for (const file of Array.from(files)) {
      try {
        const { src, width, height } = await readFileAsImage(file);
        newPhotos.push({
          id: `photo-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          src, width, height, flagType: null, annotatedSrc: null, caption: '',
        });
      } catch (e) {
        // ignore failed reads
      }
    }
    const zone = record.zones[zoneIdx];
    if (catId === '_replacements') {
      updateReplacements(zoneIdx, { photos: [...zone.replacements.photos, ...newPhotos] });
      return;
    }
    const existing = zone.categories[catId].photos;
    updateCategory(zoneIdx, catId, { photos: [...existing, ...newPhotos] });
  };

  const handleAnnotateSave = (zoneIdx, catId, photoId, dataUrl) => {
    const zone = record.zones[zoneIdx];
    if (catId === '_replacements') {
      const photos = zone.replacements.photos.map((p) =>
        p.id === photoId ? { ...p, annotatedSrc: dataUrl, flagType: p.flagType || 'issue' } : p
      );
      updateReplacements(zoneIdx, { photos });
      setAnnotating(null);
      return;
    }
    const photos = zone.categories[catId].photos.map((p) =>
      p.id === photoId ? { ...p, annotatedSrc: dataUrl, flagType: p.flagType || 'issue' } : p
    );
    updateCategory(zoneIdx, catId, { photos });
    setAnnotating(null);
  };

  const setFlag = (zoneIdx, catId, photoId, flagType) => {
    const zone = record.zones[zoneIdx];
    if (catId === '_replacements') {
      const photos = zone.replacements.photos.map((p) =>
        p.id === photoId ? { ...p, flagType: p.flagType === flagType ? null : flagType } : p
      );
      updateReplacements(zoneIdx, { photos });
      return;
    }
    const photos = zone.categories[catId].photos.map((p) =>
      p.id === photoId ? { ...p, flagType: p.flagType === flagType ? null : flagType } : p
    );
    updateCategory(zoneIdx, catId, { photos });
  };

  const removePhoto = (zoneIdx, catId, photoId) => {
    const zone = record.zones[zoneIdx];
    if (catId === '_replacements') {
      updateReplacements(zoneIdx, { photos: zone.replacements.photos.filter((p) => p.id !== photoId) });
      return;
    }
    const photos = zone.categories[catId].photos.filter((p) => p.id !== photoId);
    updateCategory(zoneIdx, catId, { photos });
  };

  const setCaption = (zoneIdx, catId, photoId, caption) => {
    const zone = record.zones[zoneIdx];
    if (catId === '_replacements') {
      updateReplacements(zoneIdx, { photos: zone.replacements.photos.map((p) => (p.id === photoId ? { ...p, caption } : p)) });
      return;
    }
    const photos = zone.categories[catId].photos.map((p) => (p.id === photoId ? { ...p, caption } : p));
    updateCategory(zoneIdx, catId, { photos });
  };

  const regenerateSummary = (zoneIdx) => {
    updateZone(zoneIdx, (z) => ({ ...z, summary: generateSummary(z) }));
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportQAPdf(record);
    } catch (e) {
      alert('Could not generate the PDF. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const confirmNewZone = () => {
    const name = pendingZoneName.trim() || `Zone ${record.zones.length + 1}`;
    addZoneAndSwitch(name);
    setAddingZone(false);
    setPendingZoneName('');
    setScreen('assess');
  };

  const NewZoneInline = () => (
    <div className="border border-slate-200 rounded-xl p-3 flex gap-2 items-center mb-3 bg-white">
      <input
        autoFocus
        className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-teal-400"
        placeholder="Zone name"
        value={pendingZoneName}
        onChange={(e) => setPendingZoneName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && confirmNewZone()}
      />
      <button onClick={confirmNewZone} className="px-3 py-2 rounded-lg bg-teal-600 text-white text-sm font-medium">Add</button>
      <button onClick={() => { setAddingZone(false); setPendingZoneName(''); }} className="px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-600">Cancel</button>
    </div>
  );

  return (
    <div className="pb-4">
      <div className="px-4 py-3 flex items-center justify-between border-b border-slate-200 bg-white sticky top-0 z-10">
        <button onClick={onClose} className="text-xs text-slate-500 flex items-center gap-1">
          <ArrowLeft size={14} /> Dashboard
        </button>
        <span className="text-sm font-medium text-slate-800 flex items-center gap-1.5">
          <ClipboardCheck size={14} className="text-teal-600" /> HortiCheck QA
        </span>
        <span className="text-xs text-slate-400">
          {record.zones.length > 0 ? `${currentZoneIdx + 1} / ${record.zones.length}` : ''}
        </span>
      </div>

      {screen === 'setup' && (
        <div className="p-4 space-y-4">
          <div>
            <h2 className="text-base font-medium text-slate-800 mb-3">Visit details</h2>
            <div className="space-y-2">
              <input
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-teal-400"
                placeholder="Client name"
                value={record.siteInfo.client}
                onChange={(e) => updateSiteInfo({ client: e.target.value })}
              />
              <input
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-teal-400"
                placeholder="Site name"
                value={record.siteInfo.site}
                onChange={(e) => updateSiteInfo({ site: e.target.value })}
              />
              <input
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-teal-400"
                placeholder="Address"
                value={record.siteInfo.address}
                onChange={(e) => updateSiteInfo({ address: e.target.value })}
              />
              <input
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-teal-400"
                placeholder="Technician(s)"
                value={record.siteInfo.technicians}
                onChange={(e) => updateSiteInfo({ technicians: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Last service date</label>
                  <input
                    type="date"
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-teal-400"
                    value={record.siteInfo.lastService}
                    onChange={(e) => updateSiteInfo({ lastService: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">QA date</label>
                  <input
                    type="date"
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-teal-400"
                    value={record.siteInfo.date}
                    onChange={(e) => updateSiteInfo({ date: e.target.value })}
                  />
                </div>
              </div>
              <input
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-teal-400"
                placeholder="Inspector / assessor"
                value={record.siteInfo.inspector}
                onChange={(e) => updateSiteInfo({ inspector: e.target.value })}
              />
            </div>
          </div>

          <div>
            <h2 className="text-base font-medium text-slate-800 mb-3">Zones</h2>
            <div className="space-y-2 mb-3">
              {record.zones.map((z, idx) => (
                <div key={z.id} className="flex items-center justify-between bg-white border border-slate-200 rounded-lg px-3 py-2">
                  <span className="text-sm text-slate-700 flex items-center gap-2">
                    <MapPin size={14} className="text-slate-400" />
                    <input
                      className="border-none outline-none bg-transparent text-sm text-slate-700"
                      value={z.name}
                      onChange={(e) => updateZone(idx, (zz) => ({ ...zz, name: e.target.value }))}
                    />
                  </span>
                  <button onClick={() => removeZone(idx)} className="text-slate-400 hover:text-red-500">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-teal-400"
                placeholder={`Zone ${record.zones.length + 1} name`}
                value={newZoneName}
                onChange={(e) => setNewZoneName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    addZone(newZoneName.trim());
                    setNewZoneName('');
                  }
                }}
              />
              <button
                onClick={() => { addZone(newZoneName.trim()); setNewZoneName(''); }}
                className="px-3 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-white"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          <button
            disabled={record.zones.length === 0}
            onClick={() => {
              const firstIncomplete = record.zones.findIndex((z) => zoneProgress(z) < CATEGORIES.length);
              setCurrentZoneIdx(firstIncomplete === -1 ? 0 : firstIncomplete);
              setScreen('assess');
              if (record.status === 'scheduled') update({ status: 'in_progress' });
            }}
            className="w-full py-2.5 rounded-lg bg-teal-600 text-white text-sm font-medium disabled:bg-slate-200 disabled:text-slate-400"
          >
            {record.status === 'scheduled' ? 'Start assessment' : 'Return to assessment'}
          </button>
        </div>
      )}

      {screen === 'assess' && currentZone && (
        <div className="pb-4">
          <div className="px-4 pt-3 pb-1">
            <div className="flex items-center gap-2 mb-2">
              <button onClick={() => setScreen('setup')} className="text-xs text-slate-500 flex items-center gap-1">
                <ArrowLeft size={14} /> Setup
              </button>
              <span className="text-sm font-medium text-slate-800 ml-1">{currentZone.name}</span>
            </div>

            {addingZone && <NewZoneInline />}

            <div className="flex gap-1.5 items-center mb-2">
              <div className="flex gap-1.5 overflow-x-auto pb-1 flex-1">
                {record.zones.map((z, idx) => {
                  const done = zoneProgress(z) === CATEGORIES.length;
                  const active = idx === currentZoneIdx;
                  return (
                    <button
                      key={z.id}
                      onClick={() => { setCurrentZoneIdx(idx); setExpandedCat(null); }}
                      className={`flex-shrink-0 px-2.5 py-1.5 rounded-lg text-xs border ${
                        active
                          ? 'bg-teal-600 text-white border-teal-600'
                          : done
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : 'bg-white text-slate-500 border-slate-200'
                      }`}
                    >
                      {z.name}
                    </button>
                  );
                })}
              </div>
              {!readOnly && (
                <button
                  onClick={() => { setAddingZone(true); setPendingZoneName(`Zone ${record.zones.length + 1}`); }}
                  className="w-8 h-8 flex items-center justify-center border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 flex-shrink-0"
                  aria-label="Add new zone"
                  title="New zone"
                >
                  <Plus size={15} />
                </button>
              )}
              <button
                onClick={() => setScreen('report')}
                className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-600 hover:bg-slate-50"
                title="Jump to report overview"
              >
                <ClipboardList size={13} /> Report
              </button>
            </div>

            <div className="h-1 bg-slate-100 rounded-full overflow-hidden mb-3">
              <div
                className="h-1 bg-teal-500"
                style={{ width: `${(zoneProgress(currentZone) / CATEGORIES.length) * 100}%` }}
              />
            </div>
          </div>

          <div className="px-4 space-y-2">
            {CATEGORIES.map((c) => {
              const entry = currentZone.categories[c.id];
              return (
                <CategoryCard
                  key={c.id}
                  category={c}
                  entry={entry}
                  expanded={expandedCat === c.id}
                  onToggle={() => setExpandedCat(expandedCat === c.id ? null : c.id)}
                  onRate={(rating) => handleRate(currentZoneIdx, c.id, rating)}
                  onFeedbackChange={(val) => updateCategory(currentZoneIdx, c.id, { feedback: val })}
                  onNotesChange={(val) => updateCategory(currentZoneIdx, c.id, { notes: val })}
                  onAddPhotos={(files) => handleAddPhotos(currentZoneIdx, c.id, files)}
                  onAnnotate={(photo) => setAnnotating({ catId: c.id, photo })}
                  onSetFlag={(photoId, flagType) => setFlag(currentZoneIdx, c.id, photoId, flagType)}
                  onRemovePhoto={(photoId) => removePhoto(currentZoneIdx, c.id, photoId)}
                  onCaptionChange={(photoId, caption) => setCaption(currentZoneIdx, c.id, photoId, caption)}
                  readOnly={readOnly}
                />
              );
            })}
            <ReplacementsCard
              replacements={currentZone.replacements}
              expanded={expandedCat === '_replacements'}
              onToggle={() => setExpandedCat(expandedCat === '_replacements' ? null : '_replacements')}
              onCountChange={(count) => updateReplacements(currentZoneIdx, { count })}
              onNotesChange={(val) => updateReplacements(currentZoneIdx, { notes: val })}
              onAddPhotos={(files) => handleAddPhotos(currentZoneIdx, '_replacements', files)}
              onAnnotate={(photo) => setAnnotating({ catId: '_replacements', photo })}
              onSetFlag={(photoId, flagType) => setFlag(currentZoneIdx, '_replacements', photoId, flagType)}
              onRemovePhoto={(photoId) => removePhoto(currentZoneIdx, '_replacements', photoId)}
              onCaptionChange={(photoId, caption) => setCaption(currentZoneIdx, '_replacements', photoId, caption)}
              readOnly={readOnly}
            />
            <CategoryCard
              category={HAZARD_CATEGORY}
              entry={currentZone.categories[HAZARD_CATEGORY.id]}
              expanded={expandedCat === HAZARD_CATEGORY.id}
              onToggle={() => setExpandedCat(expandedCat === HAZARD_CATEGORY.id ? null : HAZARD_CATEGORY.id)}
              onRate={(rating) => handleRate(currentZoneIdx, HAZARD_CATEGORY.id, rating)}
              onFeedbackChange={(val) => updateCategory(currentZoneIdx, HAZARD_CATEGORY.id, { feedback: val })}
              onNotesChange={(val) => updateCategory(currentZoneIdx, HAZARD_CATEGORY.id, { notes: val })}
              onAddPhotos={(files) => handleAddPhotos(currentZoneIdx, HAZARD_CATEGORY.id, files)}
              onAnnotate={(photo) => setAnnotating({ catId: HAZARD_CATEGORY.id, photo })}
              onSetFlag={(photoId, flagType) => setFlag(currentZoneIdx, HAZARD_CATEGORY.id, photoId, flagType)}
              onRemovePhoto={(photoId) => removePhoto(currentZoneIdx, HAZARD_CATEGORY.id, photoId)}
              onCaptionChange={(photoId, caption) => setCaption(currentZoneIdx, HAZARD_CATEGORY.id, photoId, caption)}
              readOnly={readOnly}
            />
          </div>

          <div className="px-4 pt-4 flex gap-2">
            <button
              onClick={() => { regenerateSummary(currentZoneIdx); setScreen('summary'); }}
              className="flex-1 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-600 bg-white"
            >
              Zone summary
            </button>
            {currentZoneIdx < record.zones.length - 1 ? (
              <button
                onClick={() => { setCurrentZoneIdx(currentZoneIdx + 1); setExpandedCat(null); }}
                className="flex-1 py-2.5 rounded-lg bg-teal-600 text-white text-sm font-medium"
              >
                Next zone
              </button>
            ) : (
              <button
                onClick={() => setScreen('report')}
                className="flex-1 py-2.5 rounded-lg bg-teal-600 text-white text-sm font-medium"
              >
                Report
              </button>
            )}
          </div>
        </div>
      )}

      {screen === 'summary' && currentZone && (
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <button onClick={() => setScreen('assess')} className="text-xs text-slate-500 flex items-center gap-1">
              <ArrowLeft size={14} /> {currentZone.name}
            </button>
            <span className="text-sm font-medium text-slate-800">Zone summary</span>
            <span></span>
          </div>

          {addingZone && <NewZoneInline />}

          <div className="grid grid-cols-4 gap-2">
            {RATINGS.map((r) => (
              <div key={r} className={`rounded-lg border text-center py-2 ${RATING_STYLES[r]}`}>
                <div className="text-lg font-medium">{ratingCounts(currentZone)[r]}</div>
                <div className="text-[10px] mt-0.5">{r}</div>
              </div>
            ))}
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                Narrative — auto-generated from ratings
              </p>
              {!readOnly && (
                <button
                  onClick={() => regenerateSummary(currentZoneIdx)}
                  className="text-xs text-slate-500 border border-slate-200 rounded-md px-2 py-1 flex items-center gap-1 hover:bg-slate-50"
                >
                  <RefreshCw size={11} /> Regenerate
                </button>
              )}
            </div>
            <textarea
              value={currentZone.summary}
              onChange={(e) => updateZone(currentZoneIdx, (z) => ({ ...z, summary: e.target.value }))}
              rows={8}
              readOnly={readOnly}
              className="w-full text-sm text-slate-700 border border-slate-200 rounded-lg p-2.5 resize-none focus:outline-none focus:ring-1 focus:ring-teal-400 leading-relaxed"
            />
          </div>

          <div className="flex gap-2">
            {!readOnly && (
              <button
                onClick={() => { setAddingZone(true); setPendingZoneName(`Zone ${record.zones.length + 1}`); }}
                className="flex-1 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-600 bg-white flex items-center justify-center gap-1.5"
              >
                <Plus size={14} /> New zone
              </button>
            )}
            <button
              onClick={() => setScreen('report')}
              className="flex-1 py-2.5 rounded-lg bg-teal-600 text-white text-sm font-medium"
            >
              Report
            </button>
          </div>
        </div>
      )}

      {screen === 'sitesummary' && (
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <button onClick={() => setScreen('report')} className="text-xs text-slate-500 flex items-center gap-1">
              <ArrowLeft size={14} /> Report
            </button>
            <span className="text-sm font-medium text-slate-800">Overall site summary</span>
            <span></span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {RATINGS.map((r) => (
              <div key={r} className={`rounded-lg border text-center py-2 ${RATING_STYLES[r]}`}>
                <div className="text-lg font-medium">{totalRatingCounts(record.zones)[r]}</div>
                <div className="text-[10px] mt-0.5">{r}</div>
              </div>
            ))}
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                Site-wide narrative — auto-generated
              </p>
              {!readOnly && (
                <button
                  onClick={() => update({ overallSummary: generateOverallSummary(record.zones, record.siteInfo.site) })}
                  className="text-xs text-slate-500 border border-slate-200 rounded-md px-2 py-1 flex items-center gap-1 hover:bg-slate-50"
                >
                  <RefreshCw size={11} /> Regenerate
                </button>
              )}
            </div>
            <textarea
              value={record.overallSummary}
              onChange={(e) => update({ overallSummary: e.target.value })}
              rows={8}
              readOnly={readOnly}
              className="w-full text-sm text-slate-700 border border-slate-200 rounded-lg p-2.5 resize-none focus:outline-none focus:ring-1 focus:ring-teal-400 leading-relaxed"
            />
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                Action points / priority actions
              </p>
              {!readOnly && (
                <button
                  onClick={() => update({ actionPoints: generateActionPoints(record.zones) })}
                  className="text-xs text-slate-500 border border-slate-200 rounded-md px-2 py-1 flex items-center gap-1 hover:bg-slate-50"
                >
                  <RefreshCw size={11} /> Regenerate
                </button>
              )}
            </div>
            {record.actionPoints.length === 0 ? (
              <p className="text-sm text-slate-400 italic py-1">No action points yet.</p>
            ) : (
              <div className="space-y-2">
                {record.actionPoints.map((point, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="text-slate-400 mt-2.5 text-xs">&bull;</span>
                    <textarea
                      value={point}
                      onChange={(e) => {
                        const next = [...record.actionPoints];
                        next[idx] = e.target.value;
                        update({ actionPoints: next });
                      }}
                      rows={1}
                      readOnly={readOnly}
                      className="flex-1 text-sm text-slate-700 border border-slate-200 rounded-lg p-2 resize-none focus:outline-none focus:ring-1 focus:ring-teal-400 leading-snug"
                    />
                    {!readOnly && (
                      <button
                        onClick={() => {
                          const next = record.actionPoints.filter((_, i) => i !== idx);
                          update({ actionPoints: next });
                        }}
                        aria-label="Remove action point"
                        className="mt-1 w-7 h-7 flex items-center justify-center rounded-md border border-slate-200 text-slate-400 hover:bg-slate-50 flex-shrink-0"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
            {!readOnly && (
              <button
                onClick={() => update({ actionPoints: [...record.actionPoints, ''] })}
                className="mt-2 w-full flex items-center justify-center gap-2 text-sm text-slate-500 border border-dashed border-slate-300 rounded-lg py-2 hover:bg-slate-50"
              >
                <Plus size={14} /> Add action point
              </button>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setScreen('report')}
              className="w-full py-2.5 rounded-lg bg-teal-600 text-white text-sm font-medium"
            >
              Back to report
            </button>
          </div>
        </div>
      )}

      {screen === 'report' && (
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <button onClick={() => setScreen('assess')} className="text-xs text-slate-500 flex items-center gap-1">
              <ArrowLeft size={14} /> Back
            </button>
            <span className="text-sm font-medium text-slate-800">Report overview</span>
            <span></span>
          </div>

          {record.status === 'completed' && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-2 text-sm text-green-700">
              <CheckCircle2 size={16} />
              This assessment was submitted on {formatDateUK(record.siteInfo.date)} and can no longer be edited.
            </div>
          )}

          {addingZone && <NewZoneInline />}

          <div className="bg-white border border-slate-200 rounded-xl p-3 text-sm text-slate-700 space-y-1">
            <p className="font-medium">{record.siteInfo.site || 'Untitled site'}</p>
            <p className="text-xs text-slate-500">{record.siteInfo.client}</p>
            <p className="text-xs text-slate-500">{record.siteInfo.address}</p>
            <p className="text-xs text-slate-500">Technician(s): {record.siteInfo.technicians || '-'}</p>
            <p className="text-xs text-slate-500">Last service: {formatDateUK(record.siteInfo.lastService)} &middot; QA: {formatDateUK(record.siteInfo.date)}</p>
            <p className="text-xs text-slate-500">Inspector: {record.siteInfo.inspector || '-'}</p>
          </div>

          <button
            onClick={() => {
              const patch = {};
              if (!record.overallSummary) patch.overallSummary = generateOverallSummary(record.zones, record.siteInfo.site);
              if (!record.actionPoints || record.actionPoints.length === 0) patch.actionPoints = generateActionPoints(record.zones);
              if (Object.keys(patch).length > 0) update(patch);
              setScreen('sitesummary');
            }}
            className="w-full py-2.5 rounded-lg border border-slate-200 text-sm text-slate-600 bg-white flex items-center justify-center gap-1.5"
          >
            <ClipboardList size={14} /> Overall site summary / impressions
          </button>

          <div className="space-y-2">
            {record.zones.map((z, idx) => {
              const counts = ratingCounts(z);
              return (
                <button
                  key={z.id}
                  onClick={() => { setCurrentZoneIdx(idx); setExpandedCat(null); setScreen('assess'); }}
                  className="w-full bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between text-left"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-800">{z.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{zoneProgress(z)} of {CATEGORIES.length} categories assessed</p>
                  </div>
                  <div className="flex gap-1">
                    {RATINGS.map((r) => counts[r] > 0 && (
                      <span key={r} className={`text-[10px] px-1.5 py-0.5 rounded-full border ${RATING_STYLES[r]}`}>
                        {counts[r]}
                      </span>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleExport}
              disabled={exporting}
              className="flex-1 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-600 bg-white flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Download size={14} /> {exporting ? 'Generating...' : 'Export PDF'}
            </button>
            {record.status !== 'completed' && (
              <button
                onClick={() => setShowSubmitConfirm(true)}
                className="flex-1 py-2.5 rounded-lg bg-teal-600 text-white text-sm font-medium"
              >
                Submit
              </button>
            )}
          </div>

          {showSubmitConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="bg-white rounded-xl max-w-sm w-full p-4">
                <h3 className="text-base font-medium text-slate-800 mb-2">Submit assessment?</h3>
                <p className="text-sm text-slate-500 mb-4">
                  Once submitted, this QA will be marked as completed and can no longer be edited. The QA date will be set to today's date.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowSubmitConfirm(false)}
                    className="flex-1 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-600 bg-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      const todayIso = new Date().toISOString().slice(0, 10);
                      update({ status: 'completed', siteInfo: { ...record.siteInfo, date: todayIso } });
                      setShowSubmitConfirm(false);
                    }}
                    className="flex-1 py-2.5 rounded-lg bg-teal-600 text-white text-sm font-medium"
                  >
                    Submit
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

      )}

      {annotating && (
        <AnnotatorModal
          photo={annotating.photo}
          onSave={(dataUrl) => handleAnnotateSave(currentZoneIdx, annotating.catId, annotating.photo.id, dataUrl)}
          onClose={() => setAnnotating(null)}
        />
      )}
    </div>
  );
}

/* ---------------------------------------------------------------
   Stub screen for not-yet-built modules
--------------------------------------------------------------- */

function ModuleStub({ moduleKey, onClose }) {
  const mod = MODULES[moduleKey];
  const Icon = mod.icon;
  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <button onClick={onClose} className="text-xs text-slate-500 flex items-center gap-1">
          <ArrowLeft size={14} /> Dashboard
        </button>
        <span className="text-sm font-medium text-slate-800">{mod.fullLabel}</span>
        <span></span>
      </div>
      <div className="flex flex-col items-center text-center py-12 px-6">
        <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ background: mod.bg, color: mod.text }}>
          <Icon size={26} />
        </div>
        <h2 className="text-base font-medium text-slate-800 mb-2">HortiCheck {mod.label}</h2>
        <p className="text-sm text-slate-500 max-w-xs">
          This module is on the way. {mod.fullLabel} will work alongside QA using the same zones, photos and reporting tools.
        </p>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   Root app
--------------------------------------------------------------- */

export default function HortiCheckApp() {
  const [records, setRecords] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [view, setView] = useState({ screen: 'dashboard' }); // { screen: 'dashboard' } | { screen: 'qa', id } | { screen: 'stub', module }

  // Migrates a single photo object from the old boolean `flagged` field
  // (pre-dating separate issue/good-practice flags) to the new `flagType`.
  const migratePhoto = (p) => {
    if (p.flagType !== undefined) return p;
    const { flagged, ...rest } = p;
    return { ...rest, flagType: flagged ? 'issue' : null };
  };

  const migrateRecord = (r) => ({
    actionPoints: [],
    ...r,
    zones: (r.zones || []).map((z) => {
      const migratedCategories = Object.fromEntries(
        Object.entries(z.categories || {}).map(([key, entry]) => [
          key,
          { ...entry, photos: (entry.photos || []).map(migratePhoto) },
        ])
      );
      // Backfill any categories (e.g. Display quality, Health & safety) that
      // didn't exist yet when this record was originally created.
      [...CATEGORIES, HAZARD_CATEGORY].forEach((c) => {
        if (!migratedCategories[c.id]) {
          migratedCategories[c.id] = { rating: null, feedback: '', notes: '', photos: [] };
        }
      });
      return {
        ...z,
        categories: migratedCategories,
        replacements: z.replacements
          ? { ...z.replacements, photos: (z.replacements.photos || []).map(migratePhoto) }
          : z.replacements,
      };
    }),
  });

  // Load saved records from IndexedDB on first mount.
  useEffect(() => {
    let cancelled = false;
    loadRecords().then((saved) => {
      if (cancelled) return;
      if (saved && Array.isArray(saved) && saved.length > 0) {
        setRecords(saved.map(migrateRecord));
      } else {
        // First run / nothing saved yet — seed with a sample record.
        const sample = newQARecord({
          status: 'completed',
          siteInfo: {
            client: 'Acme Property Group',
            site: 'Bishopsgate Tower',
            address: '150 Bishopsgate, London EC2M 4AT',
            technicians: 'J. Carter, M. Osei',
            lastService: '2026-06-02',
            inspector: 'R. Allen',
            date: '2026-06-09',
          },
        });
        const z = newZone('Reception');
        z.categories.plantHealth = { rating: 'Good', feedback: CATEGORIES[0].paragraphs.Good, notes: '', photos: [] };
        z.categories.containers = { rating: 'Excellent', feedback: CATEGORIES[1].paragraphs.Excellent, notes: '', photos: [] };
        sample.zones = [z];
        setRecords([sample]);
      }
      setLoaded(true);
    });
    return () => { cancelled = true; };
  }, []);

  // Persist to IndexedDB whenever records change (after initial load).
  useEffect(() => {
    if (!loaded) return;
    saveRecords(records);
  }, [records, loaded]);

  const openRecord = (id) => {
    const record = records.find((r) => r.id === id);
    if (!record) return;
    if (record.module === 'qa') {
      setView({ screen: 'qa', id });
    } else {
      setView({ screen: 'stub', module: record.module });
    }
  };

  const newQA = () => {
    const record = newQARecord({ status: 'scheduled' });
    setRecords((prev) => [...prev, record]);
    setView({ screen: 'qa', id: record.id });
  };

  const updateRecord = (id, updated) => {
    setRecords((prev) => prev.map((r) => (r.id === id ? updated : r)));
  };

  const deleteRecord = (id, siteName) => {
    if (!window.confirm(`Delete the completed assessment for "${siteName}"? This can't be undone.`)) return;
    setRecords((prev) => prev.filter((r) => r.id !== id));
  };

  if (!loaded) {
    return (
      <div className="min-h-screen bg-[#F1EFE8] font-sans flex items-center justify-center">
        <p className="text-sm text-slate-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F1EFE8] font-sans md:max-w-md md:mx-auto md:border md:border-slate-200 md:my-4 md:rounded-2xl md:overflow-hidden">
      {view.screen === 'dashboard' && (
        <Dashboard
          records={records}
          onNewQA={newQA}
          onOpenRecord={openRecord}
          onOpenModuleStub={(key) => setView({ screen: 'stub', module: key })}
          onDeleteRecord={deleteRecord}
        />
      )}
      {view.screen === 'qa' && (
        <QAFlow
          record={records.find((r) => r.id === view.id)}
          onChange={(updated) => updateRecord(view.id, updated)}
          onClose={() => setView({ screen: 'dashboard' })}
        />
      )}
      {view.screen === 'stub' && (
        <ModuleStub moduleKey={view.module} onClose={() => setView({ screen: 'dashboard' })} />
      )}
    </div>
  );
}

