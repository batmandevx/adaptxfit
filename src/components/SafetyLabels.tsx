import { TAG_LABELS } from '../data/options';

const SUPPORT_TAGS = new Set([
  'seated',
  'wheelchair-friendly',
  'chair-supported',
  'wall-supported',
  'standing-supported',
  'balance-support',
  'no-floor',
  'low-impact',
  'single-arm-friendly',
  'gentle-mobility',
  'no-equipment',
]);

const CAUTION_TAGS = new Set([
  'deep-knee-bend',
  'lunge',
  'jumping',
  'running',
  'two-arm-required',
  'floor',
  'unsupported-balance',
  'high-impact',
  'overhead',
]);

function variantFor(tag: string): string {
  if (SUPPORT_TAGS.has(tag)) return 'tag--support';
  if (CAUTION_TAGS.has(tag)) return 'tag--caution';
  return 'tag--info';
}

export function SafetyLabels({ tags, max }: { tags: string[]; max?: number }) {
  const display = tags.filter((t) => TAG_LABELS[t]);
  const shown = max ? display.slice(0, max) : display;
  return (
    <div className="tag-group">
      {shown.map((tag) => (
        <span key={tag} className={`tag ${variantFor(tag)}`}>
          {TAG_LABELS[tag]}
        </span>
      ))}
    </div>
  );
}
