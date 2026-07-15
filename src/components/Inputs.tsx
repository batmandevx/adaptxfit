import type { ReactNode } from 'react';
import type { Option } from '../data/options';

interface ToggleProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function Toggle({ label, description, checked, onChange }: ToggleProps) {
  return (
    <button
      type="button"
      className={`toggle ${checked ? 'toggle--on' : ''}`}
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
    >
      <span className="toggle-info">
        <strong>{label}</strong>
        {description ? <span>{description}</span> : null}
      </span>
      <span className="toggle-track" aria-hidden="true">
        <span className="toggle-thumb" />
      </span>
    </button>
  );
}

interface OptionChipsProps {
  legend: string;
  hint?: string;
  options: Option[];
  values: string[];
  onChange: (values: string[]) => void;
}

/** Accessible multi-select using toggle buttons (aria-pressed). */
export function OptionChips({ legend, hint, options, values, onChange }: OptionChipsProps) {
  const toggle = (value: string) => {
    onChange(values.includes(value) ? values.filter((v) => v !== value) : [...values, value]);
  };
  return (
    <fieldset className="field" style={{ border: 'none', margin: 0, padding: 0 }}>
      <legend className="field-label">{legend}</legend>
      {hint ? <p className="field-hint">{hint}</p> : null}
      <div className="option-grid" role="group" aria-label={legend}>
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={`option ${values.includes(opt.value) ? 'option--selected' : ''}`}
            aria-pressed={values.includes(opt.value)}
            onClick={() => toggle(opt.value)}
          >
            {opt.label}
            {opt.hint ? <small>{opt.hint}</small> : null}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

interface SingleSelectProps {
  legend: string;
  hint?: string;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
}

export function SingleSelect({ legend, hint, options, value, onChange }: SingleSelectProps) {
  return (
    <fieldset className="field" style={{ border: 'none', margin: 0, padding: 0 }}>
      <legend className="field-label">{legend}</legend>
      {hint ? <p className="field-hint">{hint}</p> : null}
      <div className="option-grid" role="radiogroup" aria-label={legend}>
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={value === opt.value}
            className={`option ${value === opt.value ? 'option--selected' : ''}`}
            onClick={() => onChange(opt.value)}
          >
            {opt.label}
            {opt.hint ? <small>{opt.hint}</small> : null}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

interface SegmentedProps {
  label?: string;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
}

export function Segmented({ label, options, value, onChange }: SegmentedProps) {
  return (
    <div className="segmented" role="radiogroup" aria-label={label}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="radio"
          aria-checked={value === opt.value}
          className={`segment ${value === opt.value ? 'segment--on' : ''}`}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

interface TextFieldProps {
  label: string;
  hint?: string;
  value: string;
  placeholder?: string;
  type?: string;
  onChange: (value: string) => void;
}

export function TextField({ label, hint, value, placeholder, type = 'text', onChange }: TextFieldProps) {
  return (
    <label className="field" style={{ display: 'block' }}>
      <span className="field-label">{label}</span>
      {hint ? <span className="field-hint" style={{ display: 'block' }}>{hint}</span> : null}
      <input
        className="text-input"
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

interface SelectFieldProps {
  label: string;
  hint?: string;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
}

export function SelectField({ label, hint, options, value, onChange }: SelectFieldProps) {
  return (
    <label className="field" style={{ display: 'block' }}>
      <span className="field-label">{label}</span>
      {hint ? <span className="field-hint" style={{ display: 'block' }}>{hint}</span> : null}
      <select className="select-input" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function FormSection({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="stack" aria-label={title}>
      <div>
        <h2 style={{ fontSize: '1.3rem', marginBottom: 4 }}>{title}</h2>
        {hint ? <p className="muted" style={{ margin: 0 }}>{hint}</p> : null}
      </div>
      {children}
    </section>
  );
}
