"use client";

import {
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Edit3,
  Eye,
  Image as ImageIcon,
  Info,
  Plus,
  RefreshCw,
  Search,
  Star,
  Trash2,
  X,
} from "lucide-react";

import { useCallback, useEffect, useMemo, useState } from "react";

import { apiFetch } from "@/lib/api";
import { useAdminAuth } from "@/context/AdminAuthContext";

import type {
  CategoriesResponse,
  ContentItem,
  ContentListResponse,
  ContentStatsResponse,
  ContentType,
} from "@/types/content";

interface Props {
  contentType: ContentType;
}

const AYURVEDA_TYPES = [
  "practice",
  "herb",
  "product",
  "routine",
  "nutrition",
  "knowledge",
];

const AYURVEDA_CATEGORIES = [
  "digestion",
  "stress",
  "sleep",
  "energy",
  "skin",
  "hair",
  "immunity",
  "fitness",
  "relaxation",
  "nutrition",
  "general_wellness",
];

const YOGA_TYPES = [
  "pose",
  "practice",
  "routine",
  "breathing",
  "meditation",
  "knowledge",
];

const YOGA_CATEGORIES = [
  "stress_relief",
  "sleep",
  "flexibility",
  "strength",
  "mobility",
  "digestion",
  "energy",
  "balance",
  "relaxation",
  "mental_wellbeing",
  "general_wellness",
];

const DIFFICULTIES = ["beginner", "intermediate", "advanced"];

const PAGE_SIZE = 20;

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400";

const textareaClass =
  "w-full min-h-[110px] resize-y rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400";

const buttonPrimary =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50";

const buttonSecondary =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50";

const labelClass =
  "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500";

function pretty(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (Array.isArray(value)) {
    return value.length ? value.join(", ") : "—";
  }

  if (typeof value === "object") {
    return JSON.stringify(value, null, 2);
  }

  return String(value);
}

function emptyForm(type: ContentType): Partial<ContentItem> {
  if (type === "ayurveda") {
    return {
      title: "",
      slug: "",
      shortDescription: "",
      description: "",
      type: "practice",
      category: "general_wellness",
      imageUrl: "",
      videoUrl: "",
      durationMinutes: undefined,
      bestTime: [],
      frequency: "",
      duration: "",
      preparation: "",
      usage: "",
      howToUse: [],
      doshas: [],
      prakriti: [],
      properties: {
        rasa: [],
        guna: [],
        virya: "",
        vipaka: "",
      },
      bodySystems: [],
      wellnessGoals: [],
      tags: [],
      benefits: [],
      suitableFor: [],
      ingredients: [],
      precautions: [],
      contraindications: [],
      recommendedFor: {
        energyLevels: [],
        digestion: [],
        stressLevels: [],
        sleepQualities: [],
        activityLevels: [],
        concerns: [],
        goalCategories: [],
      },
      traditionalUseNote: "",
      evidenceNote: "",
      sources: [],
      isActive: false,
      isFeatured: false,
    };
  }

  return {
    title: "",
    slug: "",
    description: "",
    imageUrl: "",
    videoUrl: "",
    type: "pose",
    category: "general_wellness",
    difficulty: "beginner",
    durationMinutes: undefined,
    equipment: [],
    bodyFocus: [],
    tags: [],
    benefits: [],
    instructions: [],
    precautions: [],
    contraindications: [],
    suitableFor: [],
    recommendedFor: {
      energyLevels: [],
      stressLevels: [],
      sleepQualities: [],
      activityLevels: [],
      yogaExperience: [],
      concerns: [],
      goalCategories: [],
    },
    isActive: false,
    isFeatured: false,
  };
}

type FormErrors = Record<string, string>;

function validateContentForm(
  form: Partial<ContentItem>,
  contentType: ContentType,
): FormErrors {
  const errors: FormErrors = {};

  const title = String(form.title || "").trim();
  const slug = String(form.slug || "").trim();
  const description = String(form.description || "").trim();

  if (title.length < 2) {
    errors.title = "Title must be at least 2 characters.";
  }

  if (title.length > 150) {
    errors.title = "Title must be 150 characters or fewer.";
  }

  if (!slug) {
    errors.slug = "Slug is required.";
  } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    errors.slug = "Use lowercase letters, numbers, and hyphens only.";
  }

  if (!description) {
    errors.description = "Description is required.";
  } else if (description.length < 10) {
    errors.description = "Description must be at least 10 characters.";
  } else if (description.length > 2000) {
    errors.description = "Description must be 2000 characters or fewer.";
  }

  if (!form.type) {
    errors.type = "Content type is required.";
  }

  if (!form.category) {
    errors.category = "Category is required.";
  }

  if (contentType === "yoga" && !form.difficulty) {
    errors.difficulty = "Difficulty is required.";
  }

  if (form.shortDescription && String(form.shortDescription).length > 300) {
    errors.shortDescription =
      "Short description must be 300 characters or fewer.";
  }

  for (const key of ["imageUrl", "videoUrl"] as const) {
    const value = String(form[key] || "").trim();

    if (value) {
      try {
        new URL(value);
      } catch {
        errors[key] = "Enter a valid URL.";
      }
    }
  }

  if (form.durationMinutes !== undefined && form.durationMinutes !== null) {
    const duration = Number(form.durationMinutes);
    const max = contentType === "ayurveda" ? 1440 : 180;

    if (!Number.isInteger(duration) || duration < 1 || duration > max) {
      errors.durationMinutes = `Duration must be a whole number between 1 and ${max} minutes.`;
    }
  }

  return errors;
}

function TagInput({
  label,
  values = [],
  onChange,
  placeholder = "Type and press Enter",
}: {
  label: string;
  values?: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
}) {
  const [value, setValue] = useState("");

  function addValue() {
    const next = value.trim();

    if (!next) return;

    if (!values.includes(next)) {
      onChange([...values, next]);
    }

    setValue("");
  }

  function removeValue(index: number) {
    onChange(values.filter((_, i) => i !== index));
  }

  return (
    <div>
      <label className={labelClass}>{label}</label>

      <div className="flex gap-2">
        <input
          className={inputClass}
          value={value}
          placeholder={placeholder}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addValue();
            }
          }}
        />

        <button type="button" className={buttonSecondary} onClick={addValue}>
          Add
        </button>
      </div>

      {!!values.length && (
        <div className="mt-2 flex flex-wrap gap-2">
          {values.map((item, index) => (
            <span
              key={`${item}-${index}`}
              className="inline-flex items-center gap-1 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700"
            >
              {item}

              <button
                type="button"
                onClick={() => removeValue(index)}
                className="rounded-full p-0.5 transition hover:bg-emerald-100"
              >
                <X size={13} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  children,
  required,
  error,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  error?: string;
}) {
  return (
    <div>
      <label className={labelClass}>
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>

      {children}

      {error && (
        <p className="mt-1.5 text-xs font-medium text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.025)] sm:p-6">
      <div className="mb-5">
        <h3 className="text-base font-bold tracking-tight text-slate-900">
          {title}
        </h3>

        {description && (
          <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
        )}
      </div>

      <div className="space-y-5">{children}</div>
    </section>
  );
}

function TextArrayEditor({
  title,
  values = [],
  onChange,
  placeholder,
}: {
  title: string;
  values?: string[];
  onChange: (values: string[]) => void;
  placeholder: string;
}) {
  function add() {
    onChange([...values, ""]);
  }

  function update(index: number, value: string) {
    const next = [...values];
    next[index] = value;
    onChange(next);
  }

  function remove(index: number) {
    onChange(values.filter((_, i) => i !== index));
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <label className={labelClass}>{title}</label>

        <button
          type="button"
          onClick={add}
          className="text-xs font-semibold text-emerald-700 transition hover:text-emerald-800"
        >
          + Add item
        </button>
      </div>

      <div className="space-y-2">
        {values.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-4 text-sm text-slate-400">
            No items added.
          </div>
        )}

        {values.map((value, index) => (
          <div key={index} className="flex gap-2">
            <input
              className={inputClass}
              value={value}
              placeholder={placeholder}
              onChange={(e) => update(index, e.target.value)}
            />

            <button
              type="button"
              onClick={() => remove(index)}
              className="rounded-xl border border-red-100 px-3 text-red-500 transition hover:bg-red-50"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function AyurvedaFields({
  form,
  setForm,
  errors = {},
}: {
  form: Partial<ContentItem>;
  setForm: React.Dispatch<React.SetStateAction<Partial<ContentItem>>>;
  errors?: FormErrors;
}) {
  const recommended = form.recommendedFor || {};
  const properties = form.properties || {};

  return (
    <>
      <Section
        title="Basic information"
        description="Core content identity and classification."
      >
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Title" required error={errors.title}>
            <input
              className={inputClass}
              value={form.title || ""}
              onChange={(e) =>
                setForm((p) => ({ ...p, title: e.target.value }))
              }
            />
          </Field>

          <Field label="Slug" required error={errors.slug}>
            <input
              className={inputClass}
              value={form.slug || ""}
              onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
            />
          </Field>
        </div>

        <Field label="Short description" error={errors.shortDescription}>
          <textarea
            className={textareaClass}
            value={form.shortDescription || ""}
            onChange={(e) =>
              setForm((p) => ({
                ...p,
                shortDescription: e.target.value,
              }))
            }
          />
        </Field>

        <Field label="Description" required error={errors.description}>
          <textarea
            className={textareaClass}
            value={form.description || ""}
            onChange={(e) =>
              setForm((p) => ({
                ...p,
                description: e.target.value,
              }))
            }
          />
        </Field>

        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Content type" required error={errors.type}>
            <select
              className={inputClass}
              value={form.type || ""}
              onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
            >
              {AYURVEDA_TYPES.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </Field>

          <Field label="Category" required error={errors.category}>
            <select
              className={inputClass}
              value={form.category || ""}
              onChange={(e) =>
                setForm((p) => ({ ...p, category: e.target.value }))
              }
            >
              {AYURVEDA_CATEGORIES.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </Field>
        </div>
      </Section>

      <Section title="Media">
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Image URL" error={errors.imageUrl}>
            <input
              className={inputClass}
              value={form.imageUrl || ""}
              onChange={(e) =>
                setForm((p) => ({ ...p, imageUrl: e.target.value }))
              }
            />
          </Field>

          <Field label="Video URL" error={errors.videoUrl}>
            <input
              className={inputClass}
              value={form.videoUrl || ""}
              onChange={(e) =>
                setForm((p) => ({ ...p, videoUrl: e.target.value }))
              }
            />
          </Field>
        </div>
      </Section>

      <Section title="Practice & routine">
        <div className="grid gap-5 md:grid-cols-3">
          <Field label="Duration minutes" error={errors.durationMinutes}>
            <input
              type="number"
              min={1}
              max={1440}
              className={inputClass}
              value={form.durationMinutes ?? ""}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  durationMinutes:
                    e.target.value === "" ? undefined : Number(e.target.value),
                }))
              }
            />
          </Field>

          <Field label="Frequency">
            <input
              className={inputClass}
              value={form.frequency || ""}
              onChange={(e) =>
                setForm((p) => ({ ...p, frequency: e.target.value }))
              }
            />
          </Field>

          <Field label="Duration">
            <input
              className={inputClass}
              value={form.duration || ""}
              onChange={(e) =>
                setForm((p) => ({ ...p, duration: e.target.value }))
              }
            />
          </Field>
        </div>

        <TagInput
          label="Best time"
          values={form.bestTime}
          onChange={(values) => setForm((p) => ({ ...p, bestTime: values }))}
        />

        <Field label="Preparation">
          <textarea
            className={textareaClass}
            value={form.preparation || ""}
            onChange={(e) =>
              setForm((p) => ({ ...p, preparation: e.target.value }))
            }
          />
        </Field>

        <Field label="Usage">
          <textarea
            className={textareaClass}
            value={form.usage || ""}
            onChange={(e) => setForm((p) => ({ ...p, usage: e.target.value }))}
          />
        </Field>

        <TextArrayEditor
          title="How to use"
          values={form.howToUse}
          onChange={(values) => setForm((p) => ({ ...p, howToUse: values }))}
          placeholder="Enter instruction"
        />
      </Section>

      <Section title="Ayurveda-specific information">
        <TagInput
          label="Doshas"
          values={form.doshas}
          onChange={(values) => setForm((p) => ({ ...p, doshas: values }))}
        />

        <TagInput
          label="Prakriti"
          values={form.prakriti}
          onChange={(values) => setForm((p) => ({ ...p, prakriti: values }))}
        />

        <div className="grid gap-5 md:grid-cols-2">
          <TagInput
            label="Rasa"
            values={properties.rasa}
            onChange={(values) =>
              setForm((p) => ({
                ...p,
                properties: {
                  ...p.properties,
                  rasa: values,
                },
              }))
            }
          />

          <TagInput
            label="Guna"
            values={properties.guna}
            onChange={(values) =>
              setForm((p) => ({
                ...p,
                properties: {
                  ...p.properties,
                  guna: values,
                },
              }))
            }
          />

          <Field label="Virya">
            <input
              className={inputClass}
              value={properties.virya || ""}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  properties: {
                    ...p.properties,
                    virya: e.target.value,
                  },
                }))
              }
            />
          </Field>

          <Field label="Vipaka">
            <input
              className={inputClass}
              value={properties.vipaka || ""}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  properties: {
                    ...p.properties,
                    vipaka: e.target.value,
                  },
                }))
              }
            />
          </Field>
        </div>
      </Section>

      <Section title="Wellness information">
        <TagInput
          label="Body systems"
          values={form.bodySystems}
          onChange={(values) => setForm((p) => ({ ...p, bodySystems: values }))}
        />

        <TagInput
          label="Wellness goals"
          values={form.wellnessGoals}
          onChange={(values) =>
            setForm((p) => ({ ...p, wellnessGoals: values }))
          }
        />

        <TagInput
          label="Tags"
          values={form.tags}
          onChange={(values) => setForm((p) => ({ ...p, tags: values }))}
        />

        <TextArrayEditor
          title="Benefits"
          values={form.benefits}
          onChange={(values) => setForm((p) => ({ ...p, benefits: values }))}
          placeholder="Describe a benefit"
        />

        <TagInput
          label="Suitable for"
          values={form.suitableFor}
          onChange={(values) => setForm((p) => ({ ...p, suitableFor: values }))}
        />
      </Section>

      <Section title="Ingredients">
        <IngredientEditor
          values={form.ingredients || []}
          onChange={(values) => setForm((p) => ({ ...p, ingredients: values }))}
        />
      </Section>

      <Section title="Safety">
        <TextArrayEditor
          title="Precautions"
          values={form.precautions}
          onChange={(values) => setForm((p) => ({ ...p, precautions: values }))}
          placeholder="Enter precaution"
        />

        <TextArrayEditor
          title="Contraindications"
          values={form.contraindications}
          onChange={(values) =>
            setForm((p) => ({ ...p, contraindications: values }))
          }
          placeholder="Enter contraindication"
        />
      </Section>

      <Section title="Personalization">
        <TagInput
          label="Energy levels"
          values={recommended.energyLevels}
          onChange={(values) =>
            setForm((p) => ({
              ...p,
              recommendedFor: {
                ...p.recommendedFor,
                energyLevels: values,
              },
            }))
          }
        />

        <TagInput
          label="Digestion"
          values={recommended.digestion}
          onChange={(values) =>
            setForm((p) => ({
              ...p,
              recommendedFor: {
                ...p.recommendedFor,
                digestion: values,
              },
            }))
          }
        />

        <TagInput
          label="Stress levels"
          values={recommended.stressLevels}
          onChange={(values) =>
            setForm((p) => ({
              ...p,
              recommendedFor: {
                ...p.recommendedFor,
                stressLevels: values,
              },
            }))
          }
        />

        <TagInput
          label="Sleep qualities"
          values={recommended.sleepQualities}
          onChange={(values) =>
            setForm((p) => ({
              ...p,
              recommendedFor: {
                ...p.recommendedFor,
                sleepQualities: values,
              },
            }))
          }
        />

        <TagInput
          label="Activity levels"
          values={recommended.activityLevels}
          onChange={(values) =>
            setForm((p) => ({
              ...p,
              recommendedFor: {
                ...p.recommendedFor,
                activityLevels: values,
              },
            }))
          }
        />

        <TagInput
          label="Concerns"
          values={recommended.concerns}
          onChange={(values) =>
            setForm((p) => ({
              ...p,
              recommendedFor: {
                ...p.recommendedFor,
                concerns: values,
              },
            }))
          }
        />

        <TagInput
          label="Goal categories"
          values={recommended.goalCategories}
          onChange={(values) =>
            setForm((p) => ({
              ...p,
              recommendedFor: {
                ...p.recommendedFor,
                goalCategories: values,
              },
            }))
          }
        />
      </Section>

      <Section title="Educational information">
        <Field label="Traditional use note">
          <textarea
            className={textareaClass}
            value={form.traditionalUseNote || ""}
            onChange={(e) =>
              setForm((p) => ({
                ...p,
                traditionalUseNote: e.target.value,
              }))
            }
          />
        </Field>

        <Field label="Evidence note">
          <textarea
            className={textareaClass}
            value={form.evidenceNote || ""}
            onChange={(e) =>
              setForm((p) => ({
                ...p,
                evidenceNote: e.target.value,
              }))
            }
          />
        </Field>
      </Section>

      <Section title="Sources">
        <SourceEditor
          values={form.sources || []}
          onChange={(values) => setForm((p) => ({ ...p, sources: values }))}
        />
      </Section>

      <ContentFlags form={form} setForm={setForm} />
    </>
  );
}

function YogaFields({
  form,
  setForm,
  errors = {},
}: {
  form: Partial<ContentItem>;
  setForm: React.Dispatch<React.SetStateAction<Partial<ContentItem>>>;
  errors?: FormErrors;
}) {
  const recommended = form.recommendedFor || {};

  return (
    <>
      <Section
        title="Basic information"
        description="Core yoga content identity and classification."
      >
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Title" required error={errors.title}>
            <input
              className={inputClass}
              value={form.title || ""}
              onChange={(e) =>
                setForm((p) => ({ ...p, title: e.target.value }))
              }
            />
          </Field>

          <Field label="Slug" required error={errors.slug}>
            <input
              className={inputClass}
              value={form.slug || ""}
              onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
            />
          </Field>
        </div>

        <Field label="Description" required error={errors.description}>
          <textarea
            className={textareaClass}
            value={form.description || ""}
            onChange={(e) =>
              setForm((p) => ({ ...p, description: e.target.value }))
            }
          />
        </Field>

        <div className="grid gap-5 md:grid-cols-3">
          <Field label="Type" required error={errors.type}>
            <select
              className={inputClass}
              value={form.type || ""}
              onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
            >
              {YOGA_TYPES.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </Field>

          <Field label="Category" required error={errors.category}>
            <select
              className={inputClass}
              value={form.category || ""}
              onChange={(e) =>
                setForm((p) => ({ ...p, category: e.target.value }))
              }
            >
              {YOGA_CATEGORIES.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </Field>

          <Field label="Difficulty" required error={errors.difficulty}>
            <select
              className={inputClass}
              value={form.difficulty || ""}
              onChange={(e) =>
                setForm((p) => ({ ...p, difficulty: e.target.value }))
              }
            >
              {DIFFICULTIES.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </Field>
        </div>
      </Section>

      <Section title="Media">
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Image URL" error={errors.imageUrl}>
            <input
              className={inputClass}
              value={form.imageUrl || ""}
              onChange={(e) =>
                setForm((p) => ({ ...p, imageUrl: e.target.value }))
              }
            />
          </Field>

          <Field label="Video URL" error={errors.videoUrl}>
            <input
              className={inputClass}
              value={form.videoUrl || ""}
              onChange={(e) =>
                setForm((p) => ({ ...p, videoUrl: e.target.value }))
              }
            />
          </Field>
        </div>
      </Section>

      <Section title="Practice">
        <Field label="Duration minutes" error={errors.durationMinutes}>
          <input
            type="number"
            min={1}
            max={180}
            className={inputClass}
            value={form.durationMinutes ?? ""}
            onChange={(e) =>
              setForm((p) => ({
                ...p,
                durationMinutes:
                  e.target.value === "" ? undefined : Number(e.target.value),
              }))
            }
          />
        </Field>

        <TagInput
          label="Equipment"
          values={form.equipment}
          onChange={(values) => setForm((p) => ({ ...p, equipment: values }))}
        />

        <TagInput
          label="Body focus"
          values={form.bodyFocus}
          onChange={(values) => setForm((p) => ({ ...p, bodyFocus: values }))}
        />
      </Section>

      <Section title="Content">
        <TagInput
          label="Tags"
          values={form.tags}
          onChange={(values) => setForm((p) => ({ ...p, tags: values }))}
        />

        <TextArrayEditor
          title="Benefits"
          values={form.benefits}
          onChange={(values) => setForm((p) => ({ ...p, benefits: values }))}
          placeholder="Describe a benefit"
        />

        <TextArrayEditor
          title="Instructions"
          values={form.instructions}
          onChange={(values) =>
            setForm((p) => ({ ...p, instructions: values }))
          }
          placeholder="Enter step/instruction"
        />

        <TextArrayEditor
          title="Precautions"
          values={form.precautions}
          onChange={(values) => setForm((p) => ({ ...p, precautions: values }))}
          placeholder="Enter precaution"
        />

        <TextArrayEditor
          title="Contraindications"
          values={form.contraindications}
          onChange={(values) =>
            setForm((p) => ({ ...p, contraindications: values }))
          }
          placeholder="Enter contraindication"
        />

        <TagInput
          label="Suitable for"
          values={form.suitableFor}
          onChange={(values) => setForm((p) => ({ ...p, suitableFor: values }))}
        />
      </Section>

      <Section title="Personalization">
        <TagInput
          label="Energy levels"
          values={recommended.energyLevels}
          onChange={(values) =>
            setForm((p) => ({
              ...p,
              recommendedFor: {
                ...p.recommendedFor,
                energyLevels: values,
              },
            }))
          }
        />

        <TagInput
          label="Stress levels"
          values={recommended.stressLevels}
          onChange={(values) =>
            setForm((p) => ({
              ...p,
              recommendedFor: {
                ...p.recommendedFor,
                stressLevels: values,
              },
            }))
          }
        />

        <TagInput
          label="Sleep qualities"
          values={recommended.sleepQualities}
          onChange={(values) =>
            setForm((p) => ({
              ...p,
              recommendedFor: {
                ...p.recommendedFor,
                sleepQualities: values,
              },
            }))
          }
        />

        <TagInput
          label="Activity levels"
          values={recommended.activityLevels}
          onChange={(values) =>
            setForm((p) => ({
              ...p,
              recommendedFor: {
                ...p.recommendedFor,
                activityLevels: values,
              },
            }))
          }
        />

        <TagInput
          label="Yoga experience"
          values={recommended.yogaExperience}
          onChange={(values) =>
            setForm((p) => ({
              ...p,
              recommendedFor: {
                ...p.recommendedFor,
                yogaExperience: values,
              },
            }))
          }
        />

        <TagInput
          label="Concerns"
          values={recommended.concerns}
          onChange={(values) =>
            setForm((p) => ({
              ...p,
              recommendedFor: {
                ...p.recommendedFor,
                concerns: values,
              },
            }))
          }
        />

        <TagInput
          label="Goal categories"
          values={recommended.goalCategories}
          onChange={(values) =>
            setForm((p) => ({
              ...p,
              recommendedFor: {
                ...p.recommendedFor,
                goalCategories: values,
              },
            }))
          }
        />
      </Section>

      <ContentFlags form={form} setForm={setForm} />
    </>
  );
}

function ContentFlags({
  form,
  setForm,
}: {
  form: Partial<ContentItem>;
  setForm: React.Dispatch<React.SetStateAction<Partial<ContentItem>>>;
}) {
  return (
    <Section title="Content management">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 bg-slate-50/50 p-4 transition hover:bg-white">
          <div>
            <p className="font-semibold text-slate-800">Active</p>
            <p className="text-xs leading-5 text-slate-500">
              Make this content available in the app.
            </p>
          </div>

          <input
            type="checkbox"
            checked={Boolean(form.isActive)}
            onChange={(e) =>
              setForm((p) => ({
                ...p,
                isActive: e.target.checked,
              }))
            }
            className="h-5 w-5 accent-emerald-600"
          />
        </label>

        <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 bg-slate-50/50 p-4 transition hover:bg-white">
          <div>
            <p className="font-semibold text-slate-800">Featured</p>
            <p className="text-xs leading-5 text-slate-500">
              Highlight this content in featured sections.
            </p>
          </div>

          <input
            type="checkbox"
            checked={Boolean(form.isFeatured)}
            onChange={(e) =>
              setForm((p) => ({
                ...p,
                isFeatured: e.target.checked,
              }))
            }
            className="h-5 w-5 accent-amber-500"
          />
        </label>
      </div>
    </Section>
  );
}

function IngredientEditor({
  values,
  onChange,
}: {
  values: NonNullable<ContentItem["ingredients"]>;
  onChange: (values: NonNullable<ContentItem["ingredients"]>) => void;
}) {
  function add() {
    onChange([
      ...values,
      {
        name: "",
        description: "",
        quantity: "",
        form: "",
      },
    ]);
  }

  function update(
    index: number,
    key: "name" | "description" | "quantity" | "form",
    value: string,
  ) {
    const next = [...values];

    next[index] = {
      ...next[index],
      [key]: value,
    };

    onChange(next);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button type="button" className={buttonSecondary} onClick={add}>
          <Plus size={16} />
          Add ingredient
        </button>
      </div>

      {values.map((ingredient, index) => (
        <div
          key={index}
          className="rounded-xl border border-slate-200 bg-slate-50 p-4"
        >
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-700">
              Ingredient {index + 1}
            </span>

            <button
              type="button"
              onClick={() => onChange(values.filter((_, i) => i !== index))}
              className="rounded-lg p-1.5 text-red-500 transition hover:bg-red-50 hover:text-red-700"
            >
              <Trash2 size={17} />
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Name">
              <input
                className={inputClass}
                value={ingredient.name || ""}
                onChange={(e) => update(index, "name", e.target.value)}
              />
            </Field>

            <Field label="Quantity">
              <input
                className={inputClass}
                value={ingredient.quantity || ""}
                onChange={(e) => update(index, "quantity", e.target.value)}
              />
            </Field>

            <Field label="Form">
              <input
                className={inputClass}
                value={ingredient.form || ""}
                onChange={(e) => update(index, "form", e.target.value)}
              />
            </Field>

            <Field label="Description">
              <input
                className={inputClass}
                value={ingredient.description || ""}
                onChange={(e) => update(index, "description", e.target.value)}
              />
            </Field>
          </div>
        </div>
      ))}
    </div>
  );
}

function SourceEditor({
  values,
  onChange,
}: {
  values: NonNullable<ContentItem["sources"]>;
  onChange: (values: NonNullable<ContentItem["sources"]>) => void;
}) {
  function add() {
    onChange([
      ...values,
      {
        title: "",
        url: "",
        publisher: "",
      },
    ]);
  }

  function update(
    index: number,
    key: "title" | "url" | "publisher",
    value: string,
  ) {
    const next = [...values];

    next[index] = {
      ...next[index],
      [key]: value,
    };

    onChange(next);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button type="button" className={buttonSecondary} onClick={add}>
          <Plus size={16} />
          Add source
        </button>
      </div>

      {values.map((source, index) => (
        <div
          key={index}
          className="rounded-xl border border-slate-200 bg-slate-50 p-4"
        >
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-700">
              Source {index + 1}
            </span>

            <button
              type="button"
              onClick={() => onChange(values.filter((_, i) => i !== index))}
              className="rounded-lg p-1.5 text-red-500 transition hover:bg-red-50"
            >
              <Trash2 size={17} />
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Title">
              <input
                className={inputClass}
                value={source.title || ""}
                onChange={(e) => update(index, "title", e.target.value)}
              />
            </Field>

            <Field label="Publisher">
              <input
                className={inputClass}
                value={source.publisher || ""}
                onChange={(e) => update(index, "publisher", e.target.value)}
              />
            </Field>

            <div className="md:col-span-2">
              <Field label="URL">
                <input
                  className={inputClass}
                  value={source.url || ""}
                  onChange={(e) => update(index, "url", e.target.value)}
                />
              </Field>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Modal                                                                      */
/* -------------------------------------------------------------------------- */

function Modal({
  children,
  onClose,
  wide = false,
  closeDisabled = false,
  className = "",
}: {
  children: React.ReactNode;
  onClose: () => void;
  wide?: boolean;
  closeDisabled?: boolean;
  className?: string;
}) {
  return (
    <div
      className="fixed inset-0 z-[100] flex h-[100dvh] w-full items-center justify-center overflow-hidden bg-slate-950/55 p-2 backdrop-blur-[3px] sm:p-4 lg:p-6"
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`relative flex max-h-[calc(100dvh-16px)] w-full flex-col overflow-hidden rounded-[22px] border border-white/60 bg-slate-50 shadow-[0_24px_80px_rgba(15,23,42,0.24)] sm:max-h-[calc(100dvh-32px)] ${
          wide ? "max-w-6xl" : "max-w-lg"
        } ${className}`}
      >
        <button
          type="button"
          onClick={onClose}
          disabled={closeDisabled}
          aria-label="Close dialog"
          className="absolute right-4 top-4 z-50 flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <X size={17} strokeWidth={2} />
        </button>

        {children}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Detail modal                                                               */
/* -------------------------------------------------------------------------- */

function DetailRow({
  label,
  value,
  fullWidth = false,
}: {
  label: string;
  value: unknown;
  fullWidth?: boolean;
}) {
  if (
    value === undefined ||
    value === null ||
    value === "" ||
    (Array.isArray(value) && value.length === 0)
  ) {
    return null;
  }

  const isObject =
    typeof value === "object" && value !== null && !Array.isArray(value);

  return (
    <div
      className={`group rounded-2xl border border-slate-200/80 bg-white p-4 transition-shadow hover:shadow-sm ${
        fullWidth ? "md:col-span-2" : ""
      }`}
    >
      <div className="mb-2 flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
          {label.replaceAll("_", " ")}
        </p>
      </div>

      {isObject ? (
        <pre className="max-h-60 overflow-auto whitespace-pre-wrap break-words rounded-xl bg-slate-50 p-3 font-mono text-xs leading-5 text-slate-600">
          {JSON.stringify(value, null, 2)}
        </pre>
      ) : Array.isArray(value) ? (
        <div className="flex flex-wrap gap-2">
          {value.map((entry, index) => (
            <span
              key={`${String(entry)}-${index}`}
              className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700"
            >
              {pretty(entry)}
            </span>
          ))}
        </div>
      ) : (
        <p className="break-words whitespace-pre-wrap text-sm leading-6 text-slate-700">
          {pretty(value)}
        </p>
      )}
    </div>
  );
}

function DetailModal({
  item,
  onClose,
}: {
  item: ContentItem;
  onClose: () => void;
}) {
  const entries = Object.entries(item).filter(
    ([, value]) =>
      value !== undefined &&
      value !== null &&
      value !== "" &&
      !(Array.isArray(value) && value.length === 0),
  );

  const statusClass = item.isActive
    ? "border-emerald-100 bg-emerald-50 text-emerald-700"
    : "border-slate-200 bg-slate-100 text-slate-600";

  return (
    <Modal onClose={onClose} wide>
      <div className="shrink-0 border-b border-slate-200 bg-white">
        <div className="px-5 pb-5 pt-5 pr-16 sm:px-7 sm:pb-6 sm:pt-6 sm:pr-20">
          <div className="flex items-start gap-4">
            {item.imageUrl ? (
              <div className="relative shrink-0">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="h-16 w-16 rounded-2xl object-cover shadow-sm ring-1 ring-slate-200 sm:h-20 sm:w-20"
                />

                <span className="absolute -bottom-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-emerald-500 text-white shadow-sm">
                  <Check size={12} strokeWidth={3} />
                </span>
              </div>
            ) : (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100 sm:h-20 sm:w-20">
                <ImageIcon size={27} strokeWidth={1.7} />
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-600">
                  {item.type}
                </span>

                <span className="text-slate-300">•</span>

                <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                  {item.category}
                </span>
              </div>

              <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">
                {item.title}
              </h2>

              <p className="mt-1 break-all text-xs text-slate-400 sm:text-sm">
                {item.slug}
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                <span
                  className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusClass}`}
                >
                  {item.isActive ? "Active" : "Inactive"}
                </span>

                {item.isFeatured && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-100 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                    <Star size={11} fill="currentColor" />
                    Featured
                  </span>
                )}

                {item.difficulty && (
                  <span className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold capitalize text-blue-700">
                    {item.difficulty}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 border-t border-slate-100 sm:grid-cols-3">
          <div className="border-r border-slate-100 px-5 py-3 sm:px-7">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Type
            </p>

            <p className="mt-1 truncate text-sm font-semibold capitalize text-slate-700">
              {item.type || "—"}
            </p>
          </div>

          <div className="px-5 py-3 sm:border-r sm:border-slate-100 sm:px-7">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Category
            </p>

            <p className="mt-1 truncate text-sm font-semibold capitalize text-slate-700">
              {item.category?.replaceAll("_", " ") || "—"}
            </p>
          </div>

          <div className="hidden px-5 py-3 sm:block sm:px-7">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Views
            </p>

            <p className="mt-1 text-sm font-semibold text-slate-700">
              {item.viewCount?.toLocaleString() || "0"}
            </p>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-slate-50/70 p-4 sm:p-6">
        {item.description && (
          <section className="mb-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <Info size={16} />
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Description
                </h3>

                <p className="text-[11px] text-slate-400">Content overview</p>
              </div>
            </div>

            <p className="whitespace-pre-wrap text-sm leading-7 text-slate-600">
              {item.description}
            </p>
          </section>
        )}

        <section>
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Content details
              </h3>

              <p className="mt-0.5 text-xs text-slate-400">
                Complete information stored for this record
              </p>
            </div>

            <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-400 ring-1 ring-slate-200">
              {entries.length} fields
            </span>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {entries.map(([key, value]) => {
              if (key === "description") {
                return null;
              }

              return (
                <DetailRow
                  key={key}
                  label={key}
                  value={value}
                  fullWidth={
                    key.toLowerCase().includes("note") ||
                    key.toLowerCase().includes("description") ||
                    key.toLowerCase().includes("preparation") ||
                    key.toLowerCase().includes("usage")
                  }
                />
              );
            })}
          </div>
        </section>
      </div>

      <div className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-200 bg-white px-4 py-3 sm:px-6">
        <p className="hidden text-xs text-slate-400 sm:block">
          Review the complete content information above.
        </p>

        <button
          type="button"
          className={`${buttonSecondary} ml-auto`}
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </Modal>
  );
}

/* -------------------------------------------------------------------------- */
/* Confirmation                                                               */
/* -------------------------------------------------------------------------- */

function ConfirmModal({
  title,
  description,
  confirmText,
  danger = false,
  loading = false,
  onCancel,
  onConfirm,
}: {
  title: string;
  description: string;
  confirmText: string;
  danger?: boolean;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal onClose={onCancel} closeDisabled={loading}>
      <div className="p-6 sm:p-7">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
            danger
              ? "bg-red-50 text-red-600 ring-1 ring-red-100"
              : "bg-amber-50 text-amber-600 ring-1 ring-amber-100"
          }`}
        >
          <AlertTriangle size={22} />
        </div>

        <h2 className="mt-5 text-lg font-bold tracking-tight text-slate-950">
          {title}
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>

        <div className="mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            className={buttonSecondary}
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </button>

          <button
            type="button"
            className={
              danger
                ? "inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                : buttonPrimary
            }
            onClick={onConfirm}
            disabled={loading}
          >
            {loading && <RefreshCw size={15} className="animate-spin" />}

            {loading ? "Saving..." : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* -------------------------------------------------------------------------- */
/* Pagination                                                                 */
/* -------------------------------------------------------------------------- */

function getPaginationItems(
  currentPage: number,
  totalPages: number,
): Array<number | "..."> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 3) {
    return [1, 2, 3, 4, "...", totalPages];
  }

  if (currentPage >= totalPages - 2) {
    return [
      1,
      "...",
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }

  return [
    1,
    "...",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "...",
    totalPages,
  ];
}

function PaginationIconButton({
  children,
  disabled,
  onClick,
  label,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-35"
    >
      {children}
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/* Main page                                                                  */
/* -------------------------------------------------------------------------- */

export default function ContentManagementPage({ contentType }: Props) {
  const { admin } = useAdminAuth();

  const label = contentType === "ayurveda" ? "Ayurveda" : "Yoga";

  const endpoint =
    contentType === "ayurveda" ? "/admin/ayurveda" : "/admin/yoga";

  const canEdit =
    admin?.role === "super_admin" ||
    admin?.role === "admin" ||
    admin?.role === "content_manager";

  const canDelete = admin?.role === "super_admin" || admin?.role === "admin";

  const [items, setItems] = useState<ContentItem[]>([]);

  const [categories, setCategories] = useState<
    { category: string; count: number }[]
  >([]);

  const [stats, setStats] = useState<ContentStatsResponse["data"] | null>(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [type, setType] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [featuredFilter, setFeaturedFilter] = useState("");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [viewItem, setViewItem] = useState<ContentItem | null>(null);

  const [editItem, setEditItem] = useState<ContentItem | null>(null);

  const [editorOpen, setEditorOpen] = useState(false);

  const [deleteItem, setDeleteItem] = useState<ContentItem | null>(null);

  const [updateConfirmation, setUpdateConfirmation] = useState(false);

  const [form, setForm] = useState<Partial<ContentItem>>(
    emptyForm(contentType),
  );

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [deleting, setDeleting] = useState(false);

  const modalOpen =
    Boolean(viewItem) ||
    editorOpen ||
    Boolean(deleteItem) ||
    updateConfirmation;

  const availableCategories = useMemo(() => {
    if (categories.length) {
      return categories.map((item) => item.category);
    }

    return contentType === "ayurveda" ? AYURVEDA_CATEGORIES : YOGA_CATEGORIES;
  }, [categories, contentType]);

  const paginationItems = useMemo(
    () => getPaginationItems(page, totalPages),
    [page, totalPages],
  );

  useEffect(() => {
    if (!modalOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;

    const previousPaddingRight = document.body.style.paddingRight;

    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";

    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow = previousOverflow;

      document.body.style.paddingRight = previousPaddingRight;
    };
  }, [modalOpen]);

  const loadData = useCallback(
    async (showRefresh = false) => {
      try {
        setError("");

        if (showRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const params = new URLSearchParams();

        params.set("page", String(page));
        params.set("limit", String(PAGE_SIZE));

        if (search.trim()) {
          params.set("search", search.trim());
        }

        if (category) {
          params.set("category", category);
        }

        if (type) {
          params.set("type", type);
        }

        if (difficulty) {
          params.set("difficulty", difficulty);
        }

        if (activeFilter) {
          params.set("isActive", activeFilter);
        }

        if (featuredFilter) {
          params.set("isFeatured", featuredFilter);
        }

        const [listResponse, statsResponse, categoryResponse] =
          await Promise.all([
            apiFetch<ContentListResponse>(`${endpoint}?${params.toString()}`),

            apiFetch<ContentStatsResponse>(`${endpoint}/stats`),

            apiFetch<CategoriesResponse>(`${endpoint}/categories`),
          ]);

        const pagination = listResponse.data.pagination;

        setItems(listResponse.data.items);

        setTotalPages(Math.max(pagination.totalPages, 1));

        setTotalItems(pagination.total);

        setStats(statsResponse.data);

        setCategories(categoryResponse.data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : `Failed to load ${label} content.`,
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [
      endpoint,
      page,
      search,
      category,
      type,
      difficulty,
      activeFilter,
      featuredFilter,
      label,
    ],
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    setPage(1);
  }, [search, category, type, difficulty, activeFilter, featuredFilter]);

  function resetEditor() {
    setEditorOpen(false);
    setEditItem(null);
    setUpdateConfirmation(false);
    setForm(emptyForm(contentType));
    setFormErrors({});
    setFormError("");
  }

  function startCreate() {
    setEditItem(null);
    setForm(emptyForm(contentType));
    setFormError("");
    setFormErrors({});
    setEditorOpen(true);
  }

  function startEdit(item: ContentItem) {
    setEditItem(item);

    setForm(JSON.parse(JSON.stringify(item)));

    setFormError("");
    setFormErrors({});
    setEditorOpen(true);
  }

  async function createContent() {
    const validation = validateContentForm(form, contentType);

    setFormErrors(validation);
    setFormError("");

    if (Object.keys(validation).length > 0) {
      setFormError("Please fix the highlighted fields before submitting.");

      return;
    }

    try {
      setSaving(true);
      setFormError("");

      await apiFetch(endpoint, {
        method: "POST",
        body: JSON.stringify(form),
      });

      resetEditor();

      await loadData(true);
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : `Failed to create ${label} content.`,
      );
    } finally {
      setSaving(false);
    }
  }

  async function updateContent() {
    if (!editItem) {
      return;
    }

    const validation = validateContentForm(form, contentType);

    setFormErrors(validation);

    if (Object.keys(validation).length > 0) {
      setUpdateConfirmation(false);

      setFormError("Please fix the highlighted fields before submitting.");

      return;
    }

    try {
      setSaving(true);
      setFormError("");

      await apiFetch(`${endpoint}/${editItem._id}`, {
        method: "PATCH",
        body: JSON.stringify(form),
      });

      resetEditor();

      await loadData(true);
    } catch (err) {
      setUpdateConfirmation(false);

      setFormError(
        err instanceof Error
          ? err.message
          : `Failed to update ${label} content.`,
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteContent() {
    if (!deleteItem) {
      return;
    }

    try {
      setDeleting(true);

      await apiFetch(`${endpoint}/${deleteItem._id}`, {
        method: "DELETE",
      });

      setDeleteItem(null);

      if (items.length === 1 && page > 1) {
        setPage((p) => p - 1);
      } else {
        await loadData(true);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : `Failed to delete ${label} content.`,
      );
    } finally {
      setDeleting(false);
    }
  }

  async function toggleStatus(item: ContentItem) {
    if (!canEdit) {
      return;
    }

    try {
      await apiFetch(`${endpoint}/${item._id}/status`, {
        method: "PATCH",
        body: JSON.stringify({
          isActive: !item.isActive,
        }),
      });

      await loadData(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status.");
    }
  }

  async function toggleFeatured(item: ContentItem) {
    if (!canEdit) {
      return;
    }

    try {
      await apiFetch(`${endpoint}/${item._id}/featured`, {
        method: "PATCH",
        body: JSON.stringify({
          isFeatured: !item.isFeatured,
        }),
      });

      await loadData(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update featured status.",
      );
    }
  }

  const firstItem = totalItems === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;

  const lastItem =
    totalItems === 0 ? 0 : Math.min(page * PAGE_SIZE, totalItems);

  return (
    <div className="min-h-full bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1600px] space-y-5 sm:space-y-6">
        {/* Header */}
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-600 sm:text-xs">
              <span>Content Management</span>
              <span className="text-slate-300">/</span>
              <span>{label}</span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              {label} Library
            </h1>

            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
              Manage {label.toLowerCase()} content, visibility, featured status
              and detailed information.
            </p>
          </div>

          <div className="flex w-full flex-wrap gap-2 sm:w-auto">
            <button
              type="button"
              className={`${buttonSecondary} flex-1 sm:flex-none`}
              onClick={() => loadData(true)}
              disabled={refreshing}
            >
              <RefreshCw
                size={16}
                className={refreshing ? "animate-spin" : ""}
              />
              Refresh
            </button>

            {canEdit && (
              <button
                type="button"
                className={`${buttonPrimary} flex-1 sm:flex-none`}
                onClick={startCreate}
              >
                <Plus size={17} />
                Add {label}
              </button>
            )}
          </div>
        </header>

        {/* Error */}
        {error && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-sm"
          >
            <AlertTriangle size={19} className="mt-0.5 shrink-0" />

            <div className="min-w-0 flex-1">
              <p className="font-bold text-red-800">Something went wrong</p>

              <p className="mt-1 leading-6">{error}</p>
            </div>

            <button
              type="button"
              aria-label="Dismiss error"
              onClick={() => setError("")}
              className="rounded-lg p-1 text-red-500 transition hover:bg-red-100 hover:text-red-700"
            >
              <X size={17} />
            </button>
          </div>
        )}

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            <StatCard label="Total" value={stats.total} />

            <StatCard label="Active" value={stats.active} />

            <StatCard label="Inactive" value={stats.inactive} />

            <StatCard label="Featured" value={stats.featured} />

            <StatCard label="Not featured" value={stats.notFeatured} />
          </div>
        )}

        {/* Filters */}
        <div className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-[0_4px_18px_rgba(15,23,42,0.035)] sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-slate-800">Browse content</p>

              <p className="mt-0.5 text-xs text-slate-400">
                Search and filter your {label.toLowerCase()} library.
              </p>
            </div>

            {(search ||
              category ||
              type ||
              difficulty ||
              activeFilter ||
              featuredFilter) && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setCategory("");
                  setType("");
                  setDifficulty("");
                  setActiveFilter("");
                  setFeaturedFilter("");
                }}
                className="shrink-0 text-xs font-semibold text-emerald-700 transition hover:text-emerald-800"
              >
                Clear filters
              </button>
            )}
          </div>

          <div className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_180px_160px_170px_150px_150px]">
            <div className="relative">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                className={`${inputClass} pl-10`}
                placeholder={`Search ${label.toLowerCase()}...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <FilterSelect
              value={category}
              onChange={setCategory}
              options={availableCategories}
              placeholder="Category"
            />

            <FilterSelect
              value={type}
              onChange={setType}
              options={contentType === "ayurveda" ? AYURVEDA_TYPES : YOGA_TYPES}
              placeholder="Type"
            />

            <FilterSelect
              value={difficulty}
              onChange={setDifficulty}
              options={DIFFICULTIES}
              placeholder="Difficulty"
            />

            <FilterSelect
              value={activeFilter}
              onChange={setActiveFilter}
              options={["true", "false"]}
              labels={["Active", "Inactive"]}
              placeholder="Status"
            />

            <FilterSelect
              value={featuredFilter}
              onChange={setFeaturedFilter}
              options={["true", "false"]}
              labels={["Featured", "Not featured"]}
              placeholder="Featured"
            />
          </div>
        </div>

        {/* Content table */}
        <div className="overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-[0_4px_18px_rgba(15,23,42,0.035)]">
          {loading ? (
            <LoadingState />
          ) : items.length === 0 ? (
            <EmptyState label={label} onCreate={startCreate} />
          ) : (
            <>
              {/* Desktop */}
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[1120px]">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80 text-left">
                      <th className="w-16 px-4 py-4 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                        #
                      </th>

                      <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                        Content
                      </th>

                      <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                        Classification
                      </th>

                      <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                        Status
                      </th>

                      <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                        Views
                      </th>

                      <th className="px-5 py-4 text-right text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {items.map((item, index) => (
                      <ContentTableRow
                        key={item._id}
                        serialNumber={(page - 1) * PAGE_SIZE + index + 1}
                        item={item}
                        canEdit={Boolean(canEdit)}
                        canDelete={Boolean(canDelete)}
                        onView={() => setViewItem(item)}
                        onEdit={() => startEdit(item)}
                        onDelete={() => setDeleteItem(item)}
                        onStatus={() => toggleStatus(item)}
                        onFeatured={() => toggleFeatured(item)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile */}
              <div className="divide-y divide-slate-100 lg:hidden">
                {items.map((item, index) => (
                  <MobileContentCard
                    key={item._id}
                    serialNumber={(page - 1) * PAGE_SIZE + index + 1}
                    item={item}
                    canEdit={Boolean(canEdit)}
                    canDelete={Boolean(canDelete)}
                    onView={() => setViewItem(item)}
                    onEdit={() => startEdit(item)}
                    onDelete={() => setDeleteItem(item)}
                    onStatus={() => toggleStatus(item)}
                    onFeatured={() => toggleFeatured(item)}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Pagination */}
        {!loading && items.length > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:px-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-medium text-slate-700">
                  Showing{" "}
                  <span className="font-bold text-slate-950">{firstItem}</span>{" "}
                  to{" "}
                  <span className="font-bold text-slate-950">{lastItem}</span>{" "}
                  of{" "}
                  <span className="font-bold text-slate-950">{totalItems}</span>
                </p>

                <p className="mt-0.5 text-xs text-slate-400">
                  Page {page} of {totalPages}
                </p>
              </div>

              <div className="flex items-center justify-between gap-1 sm:justify-end">
                <PaginationIconButton
                  label="First page"
                  disabled={page <= 1}
                  onClick={() => setPage(1)}
                >
                  <ChevronsLeft size={16} />
                </PaginationIconButton>

                <PaginationIconButton
                  label="Previous page"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft size={16} />
                </PaginationIconButton>

                <div className="flex items-center gap-1">
                  {paginationItems.map((item, index) =>
                    item === "..." ? (
                      <span
                        key={`ellipsis-${index}`}
                        className="flex h-9 w-7 items-center justify-center text-xs font-semibold text-slate-400"
                      >
                        …
                      </span>
                    ) : (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setPage(item)}
                        className={`hidden h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm font-semibold transition sm:inline-flex ${
                          item === page
                            ? "bg-slate-950 text-white shadow-sm"
                            : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                        }`}
                      >
                        {item}
                      </button>
                    ),
                  )}

                  <span className="px-2 text-xs font-semibold text-slate-500 sm:hidden">
                    {page} / {totalPages}
                  </span>
                </div>

                <PaginationIconButton
                  label="Next page"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  <ChevronRight size={16} />
                </PaginationIconButton>

                <PaginationIconButton
                  label="Last page"
                  disabled={page >= totalPages}
                  onClick={() => setPage(totalPages)}
                >
                  <ChevronsRight size={16} />
                </PaginationIconButton>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* View */}
      {viewItem && (
        <DetailModal item={viewItem} onClose={() => setViewItem(null)} />
      )}

      {/* Create / Edit */}
      {editorOpen && canEdit && (
        <Modal
          closeDisabled={saving}
          onClose={() => {
            if (saving) {
              return;
            }

            resetEditor();
          }}
          wide
        >
          <div className="flex min-h-0 flex-1 flex-col">
            {/* Modal header */}
            <div className="shrink-0 border-b border-slate-200 bg-white px-5 py-5 pr-16 sm:px-7 sm:py-6 sm:pr-20">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-600">
                  {editItem ? "Edit content" : "New content"}
                </p>
              </div>

              <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">
                {editItem ? `Edit ${label}` : `Create ${label}`}
              </h2>

              <p className="mt-1 text-sm leading-6 text-slate-500">
                Complete the fields below according to the {label} schema.
              </p>
            </div>

            {/* Scrollable modal content */}
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-slate-50/70 p-4 sm:p-6 lg:p-7">
              {saving && (
                <div className="mb-5 flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
                  <RefreshCw size={17} className="animate-spin" />

                  <span>
                    {editItem ? "Updating content..." : "Creating content..."}{" "}
                    Please wait.
                  </span>
                </div>
              )}

              {formError && (
                <div
                  role="alert"
                  className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                >
                  <AlertTriangle size={19} className="mt-0.5 shrink-0" />

                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-red-800">
                      Unable to save {label.toLowerCase()} content
                    </p>

                    <p className="mt-1 leading-6">{formError}</p>
                  </div>

                  <button
                    type="button"
                    aria-label="Dismiss form error"
                    onClick={() => setFormError("")}
                    disabled={saving}
                    className="rounded-lg p-1 text-red-500 transition hover:bg-red-100 hover:text-red-700 disabled:opacity-50"
                  >
                    <X size={17} />
                  </button>
                </div>
              )}

              {Object.keys(formErrors).length > 0 && (
                <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  <p className="font-bold">
                    Please check the highlighted fields.
                  </p>

                  <p className="mt-1 leading-6">
                    Required fields and invalid values are marked beside the
                    relevant input.
                  </p>
                </div>
              )}

              <fieldset
                disabled={saving}
                className="space-y-5 disabled:cursor-wait disabled:opacity-90"
              >
                {contentType === "ayurveda" ? (
                  <AyurvedaFields
                    form={form}
                    setForm={setForm}
                    errors={formErrors}
                  />
                ) : (
                  <YogaFields
                    form={form}
                    setForm={setForm}
                    errors={formErrors}
                  />
                )}
              </fieldset>
            </div>

            {/* Fixed footer */}
            <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-slate-200 bg-white p-4 sm:flex-row sm:justify-end sm:p-5">
              <button
                type="button"
                className={buttonSecondary}
                onClick={() => {
                  if (saving) {
                    return;
                  }

                  resetEditor();
                }}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="button"
                className={buttonPrimary}
                disabled={saving}
                onClick={() => {
                  if (saving) {
                    return;
                  }

                  const validation = validateContentForm(form, contentType);

                  setFormErrors(validation);

                  setFormError("");

                  if (Object.keys(validation).length > 0) {
                    setFormError(
                      "Please fix the highlighted fields before submitting.",
                    );

                    return;
                  }

                  if (editItem) {
                    setUpdateConfirmation(true);
                  } else {
                    createContent();
                  }
                }}
              >
                {saving && <RefreshCw size={16} className="animate-spin" />}

                {saving
                  ? editItem
                    ? "Updating..."
                    : `Creating ${label}...`
                  : editItem
                    ? "Review update"
                    : `Create ${label}`}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Update confirmation */}
      {updateConfirmation && editItem && (
        <ConfirmModal
          title={`Update ${label} content?`}
          description={`You are about to update "${editItem.title}". The changes will be saved to the existing ${label.toLowerCase()} record.`}
          confirmText="Confirm update"
          loading={saving}
          onCancel={() => setUpdateConfirmation(false)}
          onConfirm={updateContent}
        />
      )}

      {/* Delete confirmation */}
      {deleteItem && (
        <ConfirmModal
          title={`Delete ${label} content?`}
          description={`"${deleteItem.title}" will be permanently deleted. This action cannot be undone.`}
          confirmText="Delete permanently"
          danger
          loading={deleting}
          onCancel={() => setDeleteItem(null)}
          onConfirm={deleteContent}
        />
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Stats                                                                      */
/* -------------------------------------------------------------------------- */

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-[0_1px_2px_rgba(15,23,42,0.025)] sm:px-5">
      <p className="text-[11px] font-medium uppercase tracking-[0.07em] text-slate-500">
        {label}
      </p>

      <div className="mt-2 flex items-end justify-between gap-3">
        <p className="text-[26px] font-semibold leading-none tracking-tight text-slate-900">
          {value.toLocaleString()}
        </p>

        <span className="text-[11px] font-medium text-slate-400">records</span>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Filters                                                                    */
/* -------------------------------------------------------------------------- */

function FilterSelect({
  value,
  onChange,
  options,
  labels,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  labels?: string[];
  placeholder: string;
}) {
  return (
    <div className="relative">
      <select
        className={`${inputClass} appearance-none pr-9`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{placeholder}</option>

        {options.map((option, index) => (
          <option key={option} value={option}>
            {labels?.[index] || option.replaceAll("_", " ")}
          </option>
        ))}
      </select>

      <ChevronDown
        size={15}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Desktop row                                                                */
/* -------------------------------------------------------------------------- */

function ContentTableRow({
  serialNumber,
  item,
  canEdit,
  canDelete,
  onView,
  onEdit,
  onDelete,
  onStatus,
  onFeatured,
}: {
  serialNumber: number;
  item: ContentItem;
  canEdit: boolean;
  canDelete: boolean;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onStatus: () => void;
  onFeatured: () => void;
}) {
  return (
    <tr className="group transition-colors hover:bg-emerald-50/[0.28]">
      <td className="px-4 py-4 text-center">
        <span className="text-xs font-semibold tabular-nums text-slate-400">
          {String(serialNumber).padStart(2, "0")}
        </span>
      </td>

      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt=""
              className="h-11 w-11 shrink-0 rounded-xl object-cover shadow-sm ring-1 ring-slate-200"
            />
          ) : (
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
              <ImageIcon size={18} />
            </div>
          )}

          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-900">
              {item.title}
            </p>

            <p className="mt-0.5 max-w-[270px] truncate text-xs text-slate-400">
              {item.slug}
            </p>
          </div>
        </div>
      </td>

      <td className="px-5 py-4">
        <div className="flex max-w-[300px] flex-wrap gap-1.5">
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold capitalize text-slate-600">
            {item.type}
          </span>

          <span className="rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold capitalize text-emerald-700">
            {item.category?.replaceAll("_", " ")}
          </span>

          {item.difficulty && (
            <span className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold capitalize text-blue-700">
              {item.difficulty}
            </span>
          )}
        </div>
      </td>

      <td className="px-5 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onStatus}
            disabled={!canEdit}
            className={`rounded-full border px-2.5 py-1 text-[11px] font-bold transition ${
              item.isActive
                ? "border-emerald-100 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                : "border-slate-200 bg-slate-100 text-slate-500 hover:bg-slate-200"
            } disabled:cursor-not-allowed disabled:opacity-60`}
          >
            {item.isActive ? "Active" : "Inactive"}
          </button>

          {item.isFeatured && (
            <button
              type="button"
              onClick={onFeatured}
              disabled={!canEdit}
              className="inline-flex items-center gap-1 rounded-full border border-amber-100 bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Star size={11} fill="currentColor" />
              Featured
            </button>
          )}
        </div>
      </td>

      <td className="px-5 py-4">
        <span className="text-sm font-semibold tabular-nums text-slate-600">
          {item.viewCount?.toLocaleString() || 0}
        </span>
      </td>

      <td className="px-5 py-4">
        <div className="flex justify-end gap-1 opacity-80 transition-opacity group-hover:opacity-100">
          <ActionButton title="View" onClick={onView}>
            <Eye size={16} />
          </ActionButton>

          {canEdit && (
            <ActionButton title="Edit" onClick={onEdit}>
              <Edit3 size={16} />
            </ActionButton>
          )}

          {canDelete && (
            <ActionButton title="Delete" danger onClick={onDelete}>
              <Trash2 size={16} />
            </ActionButton>
          )}
        </div>
      </td>
    </tr>
  );
}

/* -------------------------------------------------------------------------- */
/* Mobile card                                                                */
/* -------------------------------------------------------------------------- */

function MobileContentCard({
  serialNumber,
  item,
  canEdit,
  canDelete,
  onView,
  onEdit,
  onDelete,
  onStatus,
  onFeatured,
}: {
  serialNumber: number;
  item: ContentItem;
  canEdit: boolean;
  canDelete: boolean;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onStatus: () => void;
  onFeatured: () => void;
}) {
  return (
    <div className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          #{String(serialNumber).padStart(2, "0")}
        </span>

        <span className="text-xs text-slate-400">
          {item.viewCount?.toLocaleString() || 0} views
        </span>
      </div>

      <div className="flex gap-3">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt=""
            className="h-14 w-14 shrink-0 rounded-xl object-cover shadow-sm ring-1 ring-slate-200"
          />
        ) : (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <ImageIcon size={20} />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-sm font-bold text-slate-900">
                {item.title}
              </h3>

              <p className="mt-0.5 truncate text-xs text-slate-400">
                {item.slug}
              </p>
            </div>

            <button
              type="button"
              onClick={onStatus}
              disabled={!canEdit}
              className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold ${
                item.isActive
                  ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 bg-slate-100 text-slate-500"
              }`}
            >
              {item.isActive ? "Active" : "Inactive"}
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold capitalize text-slate-600">
              {item.type}
            </span>

            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold capitalize text-emerald-700">
              {item.category?.replaceAll("_", " ")}
            </span>

            {item.difficulty && (
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-semibold capitalize text-blue-700">
                {item.difficulty}
              </span>
            )}

            {item.isFeatured && (
              <button
                type="button"
                disabled={!canEdit}
                onClick={onFeatured}
                className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-700"
              >
                <Star size={10} fill="currentColor" />
                Featured
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-end border-t border-slate-100 pt-3">
        <div className="flex gap-1">
          <ActionButton title="View" onClick={onView}>
            <Eye size={16} />
          </ActionButton>

          {canEdit && (
            <ActionButton title="Edit" onClick={onEdit}>
              <Edit3 size={16} />
            </ActionButton>
          )}

          {canDelete && (
            <ActionButton title="Delete" danger onClick={onDelete}>
              <Trash2 size={16} />
            </ActionButton>
          )}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Small components                                                           */
/* -------------------------------------------------------------------------- */

function ActionButton({
  children,
  onClick,
  title,
  danger = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className={`rounded-lg p-2 transition ${
        danger
          ? "text-slate-400 hover:bg-red-50 hover:text-red-600"
          : "text-slate-400 hover:bg-slate-100 hover:text-slate-900"
      }`}
    >
      {children}
    </button>
  );
}

function LoadingState() {
  return (
    <div className="space-y-3 p-5">
      {[1, 2, 3, 4, 5].map((item) => (
        <div
          key={item}
          className="h-16 animate-pulse rounded-xl bg-slate-100"
        />
      ))}
    </div>
  );
}

function EmptyState({
  label,
  onCreate,
}: {
  label: string;
  onCreate: () => void;
}) {
  return (
    <div className="flex min-h-[340px] flex-col items-center justify-center px-5 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 ring-1 ring-slate-200">
        <ImageIcon size={25} />
      </div>

      <h3 className="mt-4 font-bold text-slate-900">
        No {label.toLowerCase()} content found
      </h3>

      <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">
        Try changing your filters or create a new {label.toLowerCase()} item.
      </p>

      <button
        type="button"
        onClick={onCreate}
        className={`${buttonPrimary} mt-5`}
      >
        <Plus size={16} />
        Add {label}
      </button>
    </div>
  );
}
