"use client";

import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  Check,
  ChevronDown,
  FileText,
  Image as ImageIcon,
  Link2,
  Loader2,
  Plus,
  Save,
  ShieldCheck,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";

import {
  createHealthWellnessTip,
  updateHealthWellnessTip,
} from "@/lib/health-wellness-tip-api";
import { ApiError } from "@/lib/api";

import type {
  HealthWellnessCategory,
  HealthWellnessDifficulty,
  HealthWellnessReference,
  HealthWellnessTip,
  HealthWellnessTipFormValues,
  HealthWellnessType,
} from "@/types/health-wellness-tip";

type Props = {
  mode: "create" | "edit";
  initialData?: HealthWellnessTip | null;
  tipId?: string;
};

/* ================================================================
   Constants
================================================================ */

const CATEGORIES: {
  value: HealthWellnessCategory;
  label: string;
}[] = [
  {
    value: "nutrition",
    label: "Nutrition",
  },
  {
    value: "fitness",
    label: "Fitness",
  },
  {
    value: "yoga",
    label: "Yoga",
  },
  {
    value: "ayurveda",
    label: "Ayurveda",
  },
  {
    value: "mental-wellbeing",
    label: "Mental Wellbeing",
  },
  {
    value: "sleep",
    label: "Sleep",
  },
  {
    value: "stress-management",
    label: "Stress Management",
  },
  {
    value: "lifestyle",
    label: "Lifestyle",
  },
  {
    value: "preventive-care",
    label: "Preventive Care",
  },
  {
    value: "personal-care",
    label: "Personal Care",
  },
  {
    value: "healthy-habits",
    label: "Healthy Habits",
  },
  {
    value: "general-wellness",
    label: "General Wellness",
  },
];

const TYPES: {
  value: HealthWellnessType;
  label: string;
}[] = [
  {
    value: "tip",
    label: "Tip",
  },
  {
    value: "guide",
    label: "Guide",
  },
  {
    value: "lesson",
    label: "Lesson",
  },
  {
    value: "routine",
    label: "Routine",
  },
  {
    value: "exercise",
    label: "Exercise",
  },
  {
    value: "practice",
    label: "Practice",
  },
  {
    value: "warning",
    label: "Warning",
  },
  {
    value: "educational",
    label: "Educational",
  },
];

const DIFFICULTIES: {
  value: HealthWellnessDifficulty;
  label: string;
}[] = [
  {
    value: "beginner",
    label: "Beginner",
  },
  {
    value: "intermediate",
    label: "Intermediate",
  },
  {
    value: "advanced",
    label: "Advanced",
  },
];

const DEFAULT_DISCLAIMER =
  "This content is for general wellness and educational purposes only and is not a substitute for professional medical advice.";

const FIELD_LABELS: Record<string, string> = {
  title: "Title",
  shortDescription: "Short description",
  content: "Content",
  highlights: "Highlights",
  tags: "Tags",
  imageUrl: "Image URL",
  thumbnailUrl: "Thumbnail URL",
  sourceUrl: "Source URL",
  references: "References",
  readTimeMinutes: "Read time",
  priority: "Priority",
  startDate: "Start date",
  endDate: "End date",
  reviewerName: "Reviewer name",
  actionLabel: "Action label",
  actionRoute: "App route",
};

const ERROR_DISPLAY_LIMIT = 5;

/* ================================================================
   Helpers
================================================================ */

function createEmptyReference(): HealthWellnessReference {
  return {
    title: "",
    source: "",
    url: "",
    publishedDate: null,
  };
}

function toLocalDateTime(value?: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const pad = (number: number) => String(number).padStart(2, "0");

  return [
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    `${pad(date.getHours())}:${pad(date.getMinutes())}`,
  ].join("T");
}

function getDefaultStartDate() {
  const date = new Date();

  const pad = (number: number) => String(number).padStart(2, "0");

  return [
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    `${pad(date.getHours())}:${pad(date.getMinutes())}`,
  ].join("T");
}

function createInitialValues(
  data?: HealthWellnessTip | null,
): HealthWellnessTipFormValues {
  if (!data) {
    return {
      title: "",
      shortDescription: "",
      content: "",

      highlights: [],

      category: "general-wellness",
      type: "tip",

      tags: [],

      imageEnabled: false,
      imageUrl: "",
      imageAltText: "",
      imageCaption: "",
      imageCredit: "",

      thumbnailUrl: "",

      sourceName: "",
      sourceUrl: "",
      sourceAccessedAt: "",

      references: [],

      disclaimer: DEFAULT_DISCLAIMER,
      safetyNote: "",

      reviewed: false,
      reviewerName: "",
      reviewerQualification: "",
      reviewedAt: "",

      readTimeMinutes: "3",

      difficulty: "beginner",

      isActive: true,
      featured: false,

      priority: "0",

      startDate: getDefaultStartDate(),
      endDate: "",

      actionEnabled: false,
      actionLabel: "",
      actionRoute: "",
    };
  }

  return {
    title: data.title || "",
    shortDescription: data.shortDescription || "",
    content: data.content || "",

    highlights: Array.isArray(data.highlights) ? [...data.highlights] : [],

    category: data.category || "general-wellness",

    type: data.type || "tip",

    tags: Array.isArray(data.tags) ? [...data.tags] : [],

    imageEnabled: data.image?.enabled ?? false,

    imageUrl: data.image?.url || "",

    imageAltText: data.image?.altText || "",

    imageCaption: data.image?.caption || "",

    imageCredit: data.image?.credit || "",

    thumbnailUrl: data.thumbnailUrl || "",

    sourceName: data.source?.name || "",

    sourceUrl: data.source?.url || "",

    sourceAccessedAt: toLocalDateTime(data.source?.accessedAt),

    references: Array.isArray(data.references)
      ? data.references.map((reference) => ({
          title: reference.title || "",
          source: reference.source || "",
          url: reference.url || "",
          publishedDate: reference.publishedDate || null,
        }))
      : [],

    disclaimer: data.disclaimer || DEFAULT_DISCLAIMER,

    safetyNote: data.safetyNote || "",

    reviewed: data.reviewed ?? false,

    reviewerName: data.reviewedBy?.name || "",

    reviewerQualification: data.reviewedBy?.qualification || "",

    reviewedAt: toLocalDateTime(data.reviewedBy?.reviewedAt),

    readTimeMinutes: String(data.readTimeMinutes ?? 3),

    difficulty: data.difficulty || "beginner",

    isActive: data.isActive ?? true,

    featured: data.featured ?? false,

    priority: String(data.priority ?? 0),

    startDate: toLocalDateTime(data.startDate) || getDefaultStartDate(),

    endDate: toLocalDateTime(data.endDate),

    actionEnabled: data.action?.enabled ?? false,

    actionLabel: data.action?.label || "",

    actionRoute: data.action?.route || "",
  };
}

function isValidHttpUrl(value: string) {
  try {
    const url = new URL(value);

    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function getErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
) {
  if (error instanceof ApiError) {
    return error.message?.trim() || fallback;
  }

  if (error instanceof Error) {
    return error.message?.trim() || fallback;
  }

  if (typeof error === "object" && error !== null) {
    const possibleError = error as {
      message?: unknown;
      response?: {
        data?: {
          message?: unknown;
        };
      };
    };

    const apiMessage = possibleError.response?.data?.message;

    if (typeof apiMessage === "string" && apiMessage.trim()) {
      return apiMessage.trim();
    }

    if (
      typeof possibleError.message === "string" &&
      possibleError.message.trim()
    ) {
      return possibleError.message.trim();
    }
  }

  return fallback;
}

function validateForm(values: HealthWellnessTipFormValues) {
  const errors: Record<string, string> = {};

  if (!values.title.trim()) {
    errors.title = "Title is required.";
  } else if (values.title.trim().length > 160) {
    errors.title = "Title cannot exceed 160 characters.";
  }

  if (!values.shortDescription.trim()) {
    errors.shortDescription = "Short description is required.";
  } else if (values.shortDescription.trim().length > 400) {
    errors.shortDescription = "Short description cannot exceed 400 characters.";
  }

  if (!values.content.trim()) {
    errors.content = "Content is required.";
  } else if (values.content.trim().length > 10000) {
    errors.content = "Content cannot exceed 10,000 characters.";
  }

  if (values.highlights.length > 8) {
    errors.highlights = "You can add a maximum of 8 highlights.";
  }

  const invalidHighlight = values.highlights.find((item) => !item.trim());

  if (invalidHighlight !== undefined) {
    errors.highlights = "Each highlight needs some text.";
  }

  const invalidLongHighlight = values.highlights.find(
    (item) => item.trim().length > 250,
  );

  if (invalidLongHighlight) {
    errors.highlights = "Each highlight must be 250 characters or less.";
  }

  if (values.tags.length > 15) {
    errors.tags = "You can add a maximum of 15 tags.";
  }

  const invalidTag = values.tags.find((tag) => !tag.trim());

  if (invalidTag !== undefined) {
    errors.tags = "Tags cannot be empty.";
  }

  const invalidLongTag = values.tags.find((tag) => tag.trim().length > 40);

  if (invalidLongTag) {
    errors.tags = "Each tag must be 40 characters or less.";
  }

  if (values.imageEnabled && !values.imageUrl.trim()) {
    errors.imageUrl =
      "An image URL is required when the main image is enabled.";
  }

  if (values.imageUrl.trim() && !isValidHttpUrl(values.imageUrl.trim())) {
    errors.imageUrl = "Enter a valid HTTP or HTTPS image URL.";
  }

  if (
    values.thumbnailUrl.trim() &&
    !isValidHttpUrl(values.thumbnailUrl.trim())
  ) {
    errors.thumbnailUrl = "Enter a valid HTTP or HTTPS thumbnail URL.";
  }

  if (values.sourceUrl.trim() && !isValidHttpUrl(values.sourceUrl.trim())) {
    errors.sourceUrl = "Enter a valid HTTP or HTTPS source URL.";
  }

  if (values.references.length > 15) {
    errors.references = "You can add a maximum of 15 references.";
  }

  const invalidReference = values.references.find(
    (reference) => !reference.title.trim(),
  );

  if (invalidReference) {
    errors.references = "Every reference must have a title.";
  }

  const invalidReferenceUrl = values.references.find(
    (reference) =>
      Boolean(reference.url?.trim()) && !isValidHttpUrl(reference.url!.trim()),
  );

  if (invalidReferenceUrl) {
    errors.references = "Every reference URL must use HTTP or HTTPS.";
  }

  const readTime = Number(values.readTimeMinutes);

  if (!Number.isFinite(readTime) || readTime < 1 || readTime > 120) {
    errors.readTimeMinutes = "Read time must be between 1 and 120 minutes.";
  }

  const priority = Number(values.priority);

  if (!Number.isFinite(priority) || priority < 0 || priority > 9999) {
    errors.priority = "Priority must be between 0 and 9999.";
  }

  if (!values.startDate) {
    errors.startDate = "Start date is required.";
  } else if (Number.isNaN(new Date(values.startDate).getTime())) {
    errors.startDate = "Enter a valid start date.";
  }

  if (values.endDate && values.startDate) {
    const start = new Date(values.startDate).getTime();

    const end = new Date(values.endDate).getTime();

    if (Number.isFinite(start) && Number.isFinite(end) && end <= start) {
      errors.endDate = "End date must be later than start date.";
    }
  }

  if (values.reviewed) {
    if (!values.reviewerName.trim()) {
      errors.reviewerName =
        "Reviewer name is required when the content is marked as reviewed.";
    }
  }

  if (values.actionEnabled) {
    if (!values.actionLabel.trim()) {
      errors.actionLabel = "Action label is required.";
    }

    if (!values.actionRoute.trim()) {
      errors.actionRoute = "App route is required.";
    }
  }

  return errors;
}

/* ================================================================
   Reusable UI
================================================================ */

function FieldLabel({
  children,
  required = false,
  hint,
}: {
  children: ReactNode;
  required?: boolean;
  hint?: string;
}) {
  return (
    <div className="mb-2">
      <label className="block text-sm font-semibold text-slate-700">
        {children}

        {required ? <span className="ml-1 text-red-400">*</span> : null}
      </label>

      {hint ? (
        <p className="mt-1 text-xs leading-5 text-slate-400">{hint}</p>
      ) : null}
    </div>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  type = "text",
  maxLength,
  error,
  disabled = false,
  min,
  max,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  maxLength?: number;
  error?: string;
  disabled?: boolean;
  min?: number;
  max?: number;
}) {
  return (
    <div className="min-w-0">
      <input
        type={type}
        value={value}
        min={min}
        max={max}
        maxLength={maxLength}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={`h-11 w-full rounded-xl border bg-white px-3.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 ${
          error
            ? "border-red-200 bg-red-50/20 focus:border-red-300 focus:ring-4 focus:ring-red-50"
            : "border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50"
        } ${
          disabled
            ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400 opacity-80"
            : ""
        }`}
      />

      {error ? (
        <div className="mt-1.5 flex items-start gap-1.5 rounded-lg bg-red-50/70 px-2.5 py-1.5">
          <AlertCircle size={12} className="mt-0.5 shrink-0 text-red-400" />

          <p className="text-[11px] font-medium leading-4 text-red-500">
            {error}
          </p>
        </div>
      ) : null}
    </div>
  );
}

function Textarea({
  value,
  onChange,
  placeholder,
  maxLength,
  rows = 5,
  error,
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  rows?: number;
  error?: string;
  disabled?: boolean;
}) {
  return (
    <div className="min-w-0">
      <textarea
        value={value}
        maxLength={maxLength}
        rows={rows}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={`w-full resize-y rounded-xl border bg-white px-3.5 py-3 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 ${
          error
            ? "border-red-200 bg-red-50/20 focus:border-red-300 focus:ring-4 focus:ring-red-50"
            : "border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50"
        } ${
          disabled
            ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400 opacity-80"
            : ""
        }`}
      />

      <div className="mt-1.5 flex items-start justify-between gap-3">
        {error ? (
          <div className="flex min-w-0 items-start gap-1.5 rounded-lg bg-red-50/70 px-2.5 py-1.5">
            <AlertCircle size={12} className="mt-0.5 shrink-0 text-red-400" />

            <p className="text-[11px] font-medium leading-4 text-red-500">
              {error}
            </p>
          </div>
        ) : (
          <span />
        )}

        {maxLength ? (
          <span className="shrink-0 pt-1 text-[11px] text-slate-400">
            {value.length}/{maxLength}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function Select({
  value,
  onChange,
  options,
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  options: {
    value: string;
    label: string;
  }[];
  disabled?: boolean;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className={`h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3.5 pr-10 text-sm text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 ${
          disabled
            ? "cursor-not-allowed bg-slate-50 text-slate-400 opacity-80"
            : ""
        }`}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <ChevronDown
        size={16}
        className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
      />
    </div>
  );
}

function Section({
  icon,
  title,
  description,
  children,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_3px_18px_rgba(25,50,40,0.025)]">
      <div className="border-b border-slate-100 bg-[#fbfcfb] px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 sm:h-10 sm:w-10">
            {icon}
          </div>

          <div className="min-w-0">
            <h2 className="text-sm font-bold text-slate-900 sm:text-base">
              {title}
            </h2>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              {description}
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6">{children}</div>
    </section>
  );
}

function Toggle({
  checked,
  onChange,
  title,
  description,
  disabled = false,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  title: string;
  description: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
      className={`flex w-full items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 text-left transition ${
        disabled
          ? "cursor-not-allowed bg-slate-50 opacity-70"
          : "hover:border-emerald-200 hover:bg-emerald-50/30"
      }`}
    >
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-slate-800">
          {title}
        </span>

        <span className="mt-1 block text-xs leading-5 text-slate-500">
          {description}
        </span>
      </span>

      <span
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${
          checked ? "bg-emerald-500" : "bg-slate-300"
        } ${disabled ? "opacity-70" : ""}`}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition ${
            checked ? "left-6" : "left-1"
          }`}
        />
      </span>
    </button>
  );
}

function ErrorSummary({ errors }: { errors: Record<string, string> }) {
  const entries = Object.entries(errors);

  if (!entries.length) {
    return null;
  }

  const visibleEntries = entries.slice(0, ERROR_DISPLAY_LIMIT);

  const remaining = entries.length - visibleEntries.length;

  return (
    <div
      role="alert"
      className="mb-6 overflow-hidden rounded-2xl border border-red-200 bg-white shadow-sm"
    >
      <div className="flex items-start gap-3 border-b border-red-100 bg-red-50/70 p-4 sm:p-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-500">
          <AlertCircle size={18} />
        </div>

        <div className="min-w-0">
          <h2 className="text-sm font-bold text-red-800">
            Please review the form
          </h2>

          <p className="mt-1 text-xs leading-5 text-red-600">
            Please fix {entries.length}{" "}
            {entries.length === 1 ? "field" : "fields"} before saving this
            wellness content.
          </p>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        <div className="grid gap-2 sm:grid-cols-2">
          {visibleEntries.map(([field, message]) => (
            <div
              key={field}
              className="rounded-xl border border-red-100 bg-red-50/40 px-3 py-2.5"
            >
              <p className="text-xs font-semibold text-slate-700">
                {FIELD_LABELS[field] || field}
              </p>

              <p className="mt-0.5 text-[11px] leading-4 text-red-500">
                {message}
              </p>
            </div>
          ))}
        </div>

        {remaining > 0 ? (
          <p className="mt-3 text-[11px] font-medium text-slate-400">
            +{remaining} more {remaining === 1 ? "issue" : "issues"} to review.
          </p>
        ) : null}
      </div>
    </div>
  );
}

/* ================================================================
   Main Component
================================================================ */

export default function HealthWellnessTipForm({
  mode,
  initialData,
  tipId,
}: Props) {
  const [values, setValues] = useState<HealthWellnessTipFormValues>(() =>
    createInitialValues(initialData),
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  const [submitError, setSubmitError] = useState("");

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setValues(createInitialValues(initialData));

    setErrors({});
    setSubmitError("");
  }, [initialData]);

  const update = <K extends keyof HealthWellnessTipFormValues>(
    field: K,
    value: HealthWellnessTipFormValues[K],
  ) => {
    setValues((current) => ({
      ...current,
      [field]: value,
    }));

    setErrors((current) => {
      if (!current[field]) {
        return current;
      }

      const next = {
        ...current,
      };

      delete next[field];

      return next;
    });

    setSubmitError("");
  };

  const updateHighlight = (index: number, value: string) => {
    const next = [...values.highlights];

    next[index] = value;

    update("highlights", next);
  };

  const addHighlight = () => {
    if (saving || values.highlights.length >= 8) {
      return;
    }

    update("highlights", [...values.highlights, ""]);
  };

  const removeHighlight = (index: number) => {
    if (saving) {
      return;
    }

    update(
      "highlights",
      values.highlights.filter((_, itemIndex) => itemIndex !== index),
    );
  };

  const addTag = () => {
    if (saving || values.tags.length >= 15) {
      return;
    }

    update("tags", [...values.tags, ""]);
  };

  const updateTag = (index: number, value: string) => {
    const next = [...values.tags];

    next[index] = value;

    update("tags", next);
  };

  const removeTag = (index: number) => {
    if (saving) {
      return;
    }

    update(
      "tags",
      values.tags.filter((_, itemIndex) => itemIndex !== index),
    );
  };

  const addReference = () => {
    if (saving || values.references.length >= 15) {
      return;
    }

    update("references", [...values.references, createEmptyReference()]);
  };

  const updateReference = (
    index: number,
    field: keyof HealthWellnessReference,
    value: string,
  ) => {
    const next = values.references.map((reference, referenceIndex) =>
      referenceIndex === index
        ? {
            ...reference,
            [field]: value,
          }
        : reference,
    );

    update("references", next);
  };

  const removeReference = (index: number) => {
    if (saving) {
      return;
    }

    update(
      "references",
      values.references.filter((_, referenceIndex) => referenceIndex !== index),
    );
  };

  const imagePreview =
    values.imageEnabled && values.imageUrl.trim() ? values.imageUrl.trim() : "";

  const validationErrorCount = Object.keys(errors).length;

  const canSubmit = !saving;

  const savingText = mode === "create" ? "Creating..." : "Saving...";

  const submitText = mode === "create" ? "Create Wellness Tip" : "Save Changes";

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (saving) {
      return;
    }

    setSubmitError("");

    const validationErrors = validateForm(values);

    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      requestAnimationFrame(() => {
        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      });

      return;
    }

    setSaving(true);

    try {
      if (mode === "edit" && tipId) {
        await updateHealthWellnessTip(tipId, values);
      } else {
        await createHealthWellnessTip(values);
      }

      window.location.href = "/health-wellness-tips";
    } catch (error) {
      console.error("Failed to save wellness tip:", error);

      const message = getErrorMessage(
        error,
        mode === "create"
          ? "Unable to create the wellness tip. Please review the information and try again."
          : "Unable to save the wellness tip. Please review the information and try again.",
      );

      setSubmitError(message);

      requestAnimationFrame(() => {
        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-full bg-[#f8faf9]">
      <div className="mx-auto w-full max-w-[1180px] px-4 pb-28 pt-4 sm:px-6 sm:pt-6 lg:px-8 lg:pt-8">
        {/* ======================================================
            HEADER
        ====================================================== */}

        <div className="mb-6">
          <Link
            href="/health-wellness-tips"
            aria-disabled={saving}
            className={`inline-flex items-center gap-2 text-xs font-semibold text-slate-500 transition ${
              saving
                ? "pointer-events-none cursor-not-allowed opacity-50"
                : "hover:text-emerald-700"
            }`}
          >
            <ArrowLeft size={15} />
            Back to Wellness Tips
          </Link>

          <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-400">
                <span>Administration</span>

                <span>/</span>

                <span>Health & Wellness</span>

                <span>/</span>

                <span className="text-emerald-700">
                  {mode === "create" ? "Create" : "Edit"}
                </span>
              </div>

              <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
                {mode === "create"
                  ? "Create Wellness Tip"
                  : "Edit Wellness Tip"}
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                {mode === "create"
                  ? "Create educational health and wellness content for the Niramaya platform."
                  : "Update the content, review information, publishing settings, and app action for this wellness tip."}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-semibold text-emerald-700">
                <ShieldCheck size={13} />
                Super Admin
              </span>
            </div>
          </div>
        </div>

        {/* ======================================================
            SAVING STATUS
        ====================================================== */}

        {saving ? (
          <div
            role="status"
            aria-live="polite"
            className="mb-5 flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/80 px-4 py-3.5"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
              <Loader2 size={16} className="animate-spin" />
            </div>

            <div className="min-w-0">
              <p className="text-xs font-bold text-emerald-800 sm:text-sm">
                {mode === "create"
                  ? "Creating wellness content"
                  : "Saving wellness changes"}
              </p>

              <p className="mt-0.5 text-[11px] leading-5 text-emerald-700">
                Please wait. The form is temporarily locked to prevent duplicate
                submissions.
              </p>
            </div>
          </div>
        ) : null}

        {/* ======================================================
            VALIDATION ERROR
        ====================================================== */}

        <ErrorSummary errors={errors} />

        {/* ======================================================
            SERVER ERROR
        ====================================================== */}

        {submitError ? (
          <div
            role="alert"
            className="mb-6 overflow-hidden rounded-2xl border border-red-200 bg-white shadow-sm"
          >
            <div className="flex items-start gap-3 bg-red-50/75 p-4 sm:p-5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-500">
                <AlertCircle size={18} />
              </div>

              <div className="min-w-0 flex-1">
                <h2 className="text-sm font-bold text-red-800">
                  {mode === "create"
                    ? "Unable to create wellness content"
                    : "Unable to save wellness content"}
                </h2>

                <p className="mt-1 text-xs leading-5 text-red-600 sm:text-sm">
                  {submitError}
                </p>

                <p className="mt-2 text-[11px] leading-5 text-red-500/80">
                  No changes were submitted successfully. Please review the
                  message above and try again.
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {/* ======================================================
            FORM
        ====================================================== */}

        <form
          onSubmit={handleSubmit}
          noValidate
          className={`space-y-5 ${saving ? "cursor-wait" : ""}`}
        >
          <fieldset
            disabled={saving}
            className="min-w-0 space-y-5 disabled:cursor-not-allowed"
          >
            {/* ====================================================
                BASIC CONTENT
            ==================================================== */}

            <Section
              icon={<FileText size={19} />}
              title="Basic Information"
              description="Define the main educational content that users will read."
            >
              <div className="space-y-5">
                <div>
                  <FieldLabel required>Title</FieldLabel>

                  <Input
                    value={values.title}
                    onChange={(value) => update("title", value)}
                    placeholder="Example: 5 Simple Habits for Better Morning Hydration"
                    maxLength={160}
                    error={errors.title}
                    disabled={saving}
                  />
                </div>

                <div>
                  <FieldLabel required>Short description</FieldLabel>

                  <Textarea
                    value={values.shortDescription}
                    onChange={(value) => update("shortDescription", value)}
                    placeholder="A concise summary that helps users understand what this wellness content is about."
                    maxLength={400}
                    rows={3}
                    error={errors.shortDescription}
                    disabled={saving}
                  />
                </div>

                <div>
                  <FieldLabel
                    required
                    hint="Write the complete educational content. The backend allows up to 10,000 characters."
                  >
                    Content
                  </FieldLabel>

                  <Textarea
                    value={values.content}
                    onChange={(value) => update("content", value)}
                    placeholder="Write the full wellness guidance here..."
                    maxLength={10000}
                    rows={12}
                    error={errors.content}
                    disabled={saving}
                  />
                </div>
              </div>
            </Section>

            {/* ====================================================
                CLASSIFICATION
            ==================================================== */}

            <Section
              icon={<Sparkles size={19} />}
              title="Classification & Reading Experience"
              description="Organize the content and describe the experience users can expect."
            >
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <FieldLabel>Category</FieldLabel>

                  <Select
                    value={values.category}
                    onChange={(value) =>
                      update("category", value as HealthWellnessCategory)
                    }
                    options={CATEGORIES}
                    disabled={saving}
                  />
                </div>

                <div>
                  <FieldLabel>Content type</FieldLabel>

                  <Select
                    value={values.type}
                    onChange={(value) =>
                      update("type", value as HealthWellnessType)
                    }
                    options={TYPES}
                    disabled={saving}
                  />
                </div>

                <div>
                  <FieldLabel>Difficulty</FieldLabel>

                  <Select
                    value={values.difficulty}
                    onChange={(value) =>
                      update("difficulty", value as HealthWellnessDifficulty)
                    }
                    options={DIFFICULTIES}
                    disabled={saving}
                  />
                </div>

                <div>
                  <FieldLabel>
                    Read time{" "}
                    <span className="ml-1 text-xs font-normal text-slate-400">
                      minutes
                    </span>
                  </FieldLabel>

                  <Input
                    type="number"
                    min={1}
                    max={120}
                    value={values.readTimeMinutes}
                    onChange={(value) => update("readTimeMinutes", value)}
                    error={errors.readTimeMinutes}
                    disabled={saving}
                  />
                </div>
              </div>

              <div className="mt-6 border-t border-slate-100 pt-5">
                <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Tags</p>

                    <p className="mt-1 text-xs text-slate-400">
                      Up to 15 tags, maximum 40 characters each.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={addTag}
                    disabled={saving || values.tags.length >= 15}
                    className="inline-flex h-9 items-center justify-center gap-1.5 self-start rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Plus size={14} />
                    Add tag
                  </button>
                </div>

                {values.tags.length > 0 ? (
                  <div className="space-y-2">
                    {values.tags.map((tag, index) => (
                      <div key={`tag-${index}`} className="flex gap-2">
                        <input
                          value={tag}
                          maxLength={40}
                          disabled={saving}
                          onChange={(event) =>
                            updateTag(index, event.target.value)
                          }
                          placeholder="Example: hydration"
                          className={`h-10 min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400`}
                        />

                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => removeTag(index)}
                          className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-red-100 text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label="Remove tag"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-center text-xs text-slate-400">
                    No tags added yet.
                  </div>
                )}

                {errors.tags ? (
                  <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-red-50/70 px-2.5 py-1.5">
                    <AlertCircle
                      size={12}
                      className="mt-0.5 shrink-0 text-red-400"
                    />

                    <p className="text-[11px] font-medium text-red-500">
                      {errors.tags}
                    </p>
                  </div>
                ) : null}
              </div>
            </Section>

            {/* ====================================================
                HIGHLIGHTS
            ==================================================== */}

            <Section
              icon={<Check size={19} />}
              title="Highlights"
              description="Add concise points that summarize the most useful parts of the content."
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-slate-400">
                  {values.highlights.length}
                  /8 highlights
                </p>

                <button
                  type="button"
                  onClick={addHighlight}
                  disabled={saving || values.highlights.length >= 8}
                  className="inline-flex h-9 items-center justify-center gap-1.5 self-start rounded-lg bg-slate-900 px-3 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Plus size={14} />
                  Add highlight
                </button>
              </div>

              <div className="mt-4 space-y-2">
                {values.highlights.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-xs text-slate-400">
                    Add highlights if this content benefits from quick
                    takeaways.
                  </div>
                ) : (
                  values.highlights.map((highlight, index) => (
                    <div key={`highlight-${index}`} className="flex gap-2">
                      <div className="mt-2.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                        <Check size={12} />
                      </div>

                      <input
                        value={highlight}
                        maxLength={250}
                        disabled={saving}
                        onChange={(event) =>
                          updateHighlight(index, event.target.value)
                        }
                        placeholder="Enter an important takeaway..."
                        className="h-10 min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
                      />

                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => removeHighlight(index)}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-red-100 text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label="Remove highlight"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {errors.highlights ? (
                <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-red-50/70 px-2.5 py-1.5">
                  <AlertCircle
                    size={12}
                    className="mt-0.5 shrink-0 text-red-400"
                  />

                  <p className="text-[11px] font-medium text-red-500">
                    {errors.highlights}
                  </p>
                </div>
              ) : null}
            </Section>

            {/* ====================================================
                MEDIA
            ==================================================== */}

            <Section
              icon={<ImageIcon size={19} />}
              title="Image & Media"
              description="Configure the main image and optional thumbnail used by the wellness content."
            >
              <Toggle
                checked={values.imageEnabled}
                onChange={(checked) => update("imageEnabled", checked)}
                title="Enable main image"
                description="An image URL is required when this option is enabled."
                disabled={saving}
              />

              {values.imageEnabled ? (
                <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
                  <div className="min-w-0 space-y-5">
                    <div>
                      <FieldLabel required>Image URL</FieldLabel>

                      <Input
                        value={values.imageUrl}
                        onChange={(value) => update("imageUrl", value)}
                        placeholder="https://example.com/wellness-image.jpg"
                        maxLength={1000}
                        error={errors.imageUrl}
                        disabled={saving}
                      />
                    </div>

                    <div>
                      <FieldLabel>Alt text</FieldLabel>

                      <Input
                        value={values.imageAltText}
                        onChange={(value) => update("imageAltText", value)}
                        placeholder="Describe the image for accessibility"
                        maxLength={200}
                        disabled={saving}
                      />
                    </div>

                    <div>
                      <FieldLabel>Caption</FieldLabel>

                      <Input
                        value={values.imageCaption}
                        onChange={(value) => update("imageCaption", value)}
                        placeholder="Optional image caption"
                        maxLength={300}
                        disabled={saving}
                      />
                    </div>

                    <div>
                      <FieldLabel>Credit</FieldLabel>

                      <Input
                        value={values.imageCredit}
                        onChange={(value) => update("imageCredit", value)}
                        placeholder="Photographer, organization, or source"
                        maxLength={200}
                        disabled={saving}
                      />
                    </div>
                  </div>

                  <div className="min-w-0">
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                      {imagePreview ? (
                        <img
                          src={imagePreview}
                          alt={values.imageAltText || "Wellness preview"}
                          className="aspect-square w-full object-cover"
                          onError={(event) => {
                            event.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="flex aspect-square flex-col items-center justify-center px-5 text-center">
                          <ImageIcon size={28} className="text-slate-300" />

                          <p className="mt-3 text-xs font-semibold text-slate-500">
                            Image preview
                          </p>

                          <p className="mt-1 text-[11px] leading-5 text-slate-400">
                            Enter a valid image URL to preview it.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="mt-5">
                <FieldLabel>Thumbnail URL</FieldLabel>

                <Input
                  value={values.thumbnailUrl}
                  onChange={(value) => update("thumbnailUrl", value)}
                  placeholder="https://example.com/wellness-thumbnail.jpg"
                  maxLength={1000}
                  error={errors.thumbnailUrl}
                  disabled={saving}
                />
              </div>
            </Section>

            {/* ====================================================
                SOURCE
            ==================================================== */}

            <Section
              icon={<Link2 size={19} />}
              title="Source & References"
              description="Record the source of the wellness content and supporting references."
            >
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <FieldLabel>Source name</FieldLabel>

                  <Input
                    value={values.sourceName}
                    onChange={(value) => update("sourceName", value)}
                    placeholder="Example: WHO"
                    maxLength={200}
                    disabled={saving}
                  />
                </div>

                <div>
                  <FieldLabel>Source URL</FieldLabel>

                  <Input
                    value={values.sourceUrl}
                    onChange={(value) => update("sourceUrl", value)}
                    placeholder="https://www.who.int/..."
                    maxLength={1000}
                    error={errors.sourceUrl}
                    disabled={saving}
                  />
                </div>

                <div>
                  <FieldLabel>Source accessed at</FieldLabel>

                  <Input
                    type="datetime-local"
                    value={values.sourceAccessedAt}
                    onChange={(value) => update("sourceAccessedAt", value)}
                    disabled={saving}
                  />
                </div>
              </div>

              <div className="mt-7 border-t border-slate-100 pt-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">
                      References
                    </h3>

                    <p className="mt-1 text-xs text-slate-400">
                      Up to 15 supporting references.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={addReference}
                    disabled={saving || values.references.length >= 15}
                    className="inline-flex h-9 items-center justify-center gap-1.5 self-start rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Plus size={14} />
                    Add reference
                  </button>
                </div>

                <div className="mt-4 space-y-4">
                  {values.references.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-xs text-slate-400">
                      No references added.
                    </div>
                  ) : (
                    values.references.map((reference, index) => (
                      <div
                        key={`reference-${index}`}
                        className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4"
                      >
                        <div className="mb-4 flex items-center justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-2">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-xs font-bold text-slate-500 ring-1 ring-slate-200">
                              {index + 1}
                            </span>

                            <span className="truncate text-xs font-bold text-slate-700">
                              Reference {index + 1}
                            </span>
                          </div>

                          <button
                            type="button"
                            disabled={saving}
                            onClick={() => removeReference(index)}
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                            aria-label="Remove reference"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <div className="md:col-span-2">
                            <FieldLabel required>Reference title</FieldLabel>

                            <Input
                              value={reference.title}
                              onChange={(value) =>
                                updateReference(index, "title", value)
                              }
                              placeholder="Reference or publication title"
                              maxLength={250}
                              disabled={saving}
                            />
                          </div>

                          <div>
                            <FieldLabel>Source</FieldLabel>

                            <Input
                              value={reference.source || ""}
                              onChange={(value) =>
                                updateReference(index, "source", value)
                              }
                              placeholder="Organization or publication"
                              maxLength={200}
                              disabled={saving}
                            />
                          </div>

                          <div>
                            <FieldLabel>Published date</FieldLabel>

                            <Input
                              type="date"
                              value={
                                reference.publishedDate
                                  ? String(reference.publishedDate).slice(0, 10)
                                  : ""
                              }
                              onChange={(value) =>
                                updateReference(index, "publishedDate", value)
                              }
                              disabled={saving}
                            />
                          </div>

                          <div className="md:col-span-2">
                            <FieldLabel>URL</FieldLabel>

                            <Input
                              value={reference.url || ""}
                              onChange={(value) =>
                                updateReference(index, "url", value)
                              }
                              placeholder="https://..."
                              maxLength={1000}
                              disabled={saving}
                            />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {errors.references ? (
                  <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-red-50/70 px-2.5 py-1.5">
                    <AlertCircle
                      size={12}
                      className="mt-0.5 shrink-0 text-red-400"
                    />

                    <p className="text-[11px] font-medium text-red-500">
                      {errors.references}
                    </p>
                  </div>
                ) : null}
              </div>
            </Section>

            {/* ====================================================
                SAFETY & REVIEW
            ==================================================== */}

            <Section
              icon={<ShieldCheck size={19} />}
              title="Safety & Review"
              description="Provide wellness safety information and professional review details."
            >
              <div className="space-y-5">
                <div>
                  <FieldLabel hint="This disclaimer is shown with the wellness content and defaults to the platform's standard disclaimer.">
                    Disclaimer
                  </FieldLabel>

                  <Textarea
                    value={values.disclaimer}
                    onChange={(value) => update("disclaimer", value)}
                    maxLength={1000}
                    rows={4}
                    disabled={saving}
                  />
                </div>

                <div>
                  <FieldLabel>Safety note</FieldLabel>

                  <Textarea
                    value={values.safetyNote}
                    onChange={(value) => update("safetyNote", value)}
                    placeholder="Add any important safety guidance, precautions, or limitations."
                    maxLength={1000}
                    rows={4}
                    disabled={saving}
                  />
                </div>

                <div className="border-t border-slate-100 pt-5">
                  <Toggle
                    checked={values.reviewed}
                    onChange={(checked) => update("reviewed", checked)}
                    title="Content professionally reviewed"
                    description="Mark this content as reviewed only when reviewer information is available."
                    disabled={saving}
                  />
                </div>

                {values.reviewed ? (
                  <div className="grid grid-cols-1 gap-5 border-t border-slate-100 pt-5 md:grid-cols-2">
                    <div>
                      <FieldLabel required>Reviewer name</FieldLabel>

                      <Input
                        value={values.reviewerName}
                        onChange={(value) => update("reviewerName", value)}
                        placeholder="Reviewer name"
                        maxLength={150}
                        error={errors.reviewerName}
                        disabled={saving}
                      />
                    </div>

                    <div>
                      <FieldLabel>Qualification</FieldLabel>

                      <Input
                        value={values.reviewerQualification}
                        onChange={(value) =>
                          update("reviewerQualification", value)
                        }
                        placeholder="Example: BAMS, MD Ayurveda"
                        maxLength={150}
                        disabled={saving}
                      />
                    </div>

                    <div>
                      <FieldLabel>Reviewed at</FieldLabel>

                      <Input
                        type="datetime-local"
                        value={values.reviewedAt}
                        onChange={(value) => update("reviewedAt", value)}
                        disabled={saving}
                      />
                    </div>
                  </div>
                ) : null}
              </div>
            </Section>

            {/* ====================================================
                PUBLISHING
            ==================================================== */}

            <Section
              icon={<CalendarDays size={19} />}
              title="Publishing"
              description="Control visibility, priority, featured placement, and publication timing."
            >
              <div className="space-y-4">
                <Toggle
                  checked={values.isActive}
                  onChange={(checked) => update("isActive", checked)}
                  title="Active"
                  description="Active content can be displayed to users when it falls within the configured date range."
                  disabled={saving}
                />

                <Toggle
                  checked={values.featured}
                  onChange={(checked) => update("featured", checked)}
                  title="Featured"
                  description="Feature this content in wellness areas that support featured content."
                  disabled={saving}
                />
              </div>

              <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-3">
                <div>
                  <FieldLabel>Priority</FieldLabel>

                  <Input
                    type="number"
                    min={0}
                    max={9999}
                    value={values.priority}
                    onChange={(value) => update("priority", value)}
                    error={errors.priority}
                    disabled={saving}
                  />

                  <p className="mt-1.5 text-[11px] text-slate-400">
                    Higher values receive higher priority.
                  </p>
                </div>

                <div>
                  <FieldLabel required>Start date</FieldLabel>

                  <Input
                    type="datetime-local"
                    value={values.startDate}
                    onChange={(value) => update("startDate", value)}
                    error={errors.startDate}
                    disabled={saving}
                  />
                </div>

                <div>
                  <FieldLabel>End date</FieldLabel>

                  <Input
                    type="datetime-local"
                    value={values.endDate}
                    onChange={(value) => update("endDate", value)}
                    error={errors.endDate}
                    disabled={saving}
                  />
                </div>
              </div>
            </Section>

            {/* ====================================================
                ACTION
            ==================================================== */}

            <Section
              icon={<ArrowLeft size={19} />}
              title="Optional App Action"
              description="Give users a button that navigates to another area of the Niramaya app."
            >
              <Toggle
                checked={values.actionEnabled}
                onChange={(checked) => update("actionEnabled", checked)}
                title="Enable app action"
                description="Action label and route are required when enabled."
                disabled={saving}
              />

              {values.actionEnabled ? (
                <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div>
                    <FieldLabel required>Action label</FieldLabel>

                    <Input
                      value={values.actionLabel}
                      onChange={(value) => update("actionLabel", value)}
                      placeholder="Start this routine"
                      maxLength={50}
                      error={errors.actionLabel}
                      disabled={saving}
                    />
                  </div>

                  <div>
                    <FieldLabel required>App route</FieldLabel>

                    <Input
                      value={values.actionRoute}
                      onChange={(value) => update("actionRoute", value)}
                      placeholder="/yoga"
                      maxLength={200}
                      error={errors.actionRoute}
                      disabled={saving}
                    />
                  </div>
                </div>
              ) : null}
            </Section>
          </fieldset>

          {/* ====================================================
              FOOTER ACTIONS
          ==================================================== */}

          <div className="sticky bottom-0 z-20 -mx-4 border-t border-slate-200 bg-[#f8faf9]/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
            <div className="mx-auto flex max-w-[1180px] flex-col-reverse gap-2.5 sm:flex-row sm:items-center sm:justify-between">
              <Link
                href="/health-wellness-tips"
                aria-disabled={saving}
                className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-600 transition ${
                  saving
                    ? "pointer-events-none cursor-not-allowed opacity-50"
                    : "hover:bg-slate-50"
                }`}
              >
                <X size={16} />
                Cancel
              </Link>

              <button
                type="submit"
                disabled={!canSubmit}
                className="inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#315c4a] px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-[#264b3c] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {saving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />

                    <span>{savingText}</span>
                  </>
                ) : (
                  <>
                    <Save size={16} />

                    <span>{submitText}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* ======================================================
            SMALL VALIDATION STATUS
        ====================================================== */}

        {validationErrorCount > 0 && !saving ? (
          <div className="mt-4 flex items-center justify-center gap-2 text-center text-[11px] text-slate-400">
            <AlertCircle size={12} className="text-red-400" />

            <span>
              {validationErrorCount}{" "}
              {validationErrorCount === 1 ? "field needs" : "fields need"} your
              attention before saving.
            </span>
          </div>
        ) : null}
      </div>
    </main>
  );
}
