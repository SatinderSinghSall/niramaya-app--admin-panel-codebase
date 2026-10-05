"use client";

import {
  AlertTriangle,
  ArrowDownAZ,
  ArrowUpAZ,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Clipboard,
  Code2,
  Database as DatabaseIcon,
  Eye,
  FileJson,
  FilePlus2,
  Filter,
  Hash,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Server,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { apiFetch, ApiError } from "@/lib/api";
import { useAdminAuth } from "@/context/AdminAuthContext";
import type {
  DatabaseCollection,
  DatabaseCollectionOverview,
  DatabaseCollectionsResponse,
  DatabaseDocument,
  DatabaseDocumentsResponse,
  DatabaseSchemaResponse,
} from "@/types/database";

type ModalType = "view" | "create" | "edit" | "schema" | "delete" | null;

const PAGE_SIZE = 25;

const cardClass =
  "rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_30px_rgba(15,23,42,0.04)]";

const inputClass =
  "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50";

function getErrorMessage(error: unknown, fallback = "Something went wrong.") {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return fallback;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-IN").format(value);
}

function prettyCollectionName(name: string) {
  return name
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatValue(value: unknown) {
  if (value === null) return "null";
  if (value === undefined) return "undefined";

  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function getDocumentId(document: DatabaseDocument) {
  return typeof document._id === "string" ? document._id : "";
}

function canWrite(role?: string) {
  return (
    role === "super_admin" || role === "admin" || role === "content_manager"
  );
}

function canDelete(role?: string) {
  return role === "super_admin" || role === "admin";
}

function ModalShell({
  title,
  description,
  children,
  onClose,
  footer,
  wide = false,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  onClose: () => void;
  footer?: ReactNode;
  wide?: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 p-3 backdrop-blur-[3px] sm:p-6"
      onMouseDown={(event) => event.stopPropagation()}
    >
      <div
        className={`flex max-h-[92vh] w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl ${
          wide ? "max-w-5xl" : "max-w-2xl"
        }`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
          <div className="min-w-0 pr-4">
            <h2 className="text-lg font-semibold tracking-tight text-slate-950">
              {title}
            </h2>

            {description ? (
              <p className="mt-1 text-sm text-slate-500">{description}</p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>

        {footer ? (
          <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function EmptyState({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon?: ReactNode;
}) {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center px-6 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        {icon || <DatabaseIcon className="h-6 w-6" />}
      </div>

      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>

      <p className="mt-1 max-w-md text-sm text-slate-500">{description}</p>
    </div>
  );
}

export default function DatabasePage() {
  const { admin } = useAdminAuth();

  const [collections, setCollections] = useState<DatabaseCollection[]>([]);
  const [collectionsLoading, setCollectionsLoading] = useState(true);
  const [collectionsError, setCollectionsError] = useState("");

  const [selectedCollection, setSelectedCollection] = useState("");

  const [overview, setOverview] = useState<DatabaseCollectionOverview | null>(
    null,
  );

  const [documents, setDocuments] = useState<DatabaseDocument[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [documentsError, setDocumentsError] = useState("");

  const [pagination, setPagination] = useState({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    pages: 0,
  });

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [modal, setModal] = useState<ModalType>(null);
  const [selectedDocument, setSelectedDocument] =
    useState<DatabaseDocument | null>(null);

  const [schema, setSchema] = useState<DatabaseSchemaResponse | null>(null);
  const [schemaLoading, setSchemaLoading] = useState(false);
  const [schemaError, setSchemaError] = useState("");

  const [refreshing, setRefreshing] = useState(false);

  const [pageError, setPageError] = useState("");

  const role = admin?.role;

  const totalDocuments = useMemo(
    () => collections.reduce((sum, item) => sum + item.documents, 0),
    [collections],
  );

  const largestCollection = useMemo(() => {
    if (!collections.length) return null;

    return [...collections].sort((a, b) => b.documents - a.documents)[0];
  }, [collections]);

  const loadCollections = useCallback(async () => {
    setCollectionsError("");

    try {
      const response = await apiFetch<{
        success: boolean;
        data: DatabaseCollectionsResponse;
      }>("/admin/database/collections");

      const items = response.data.collections || [];

      setCollections(items);

      if (
        selectedCollection &&
        !items.some((item) => item.name === selectedCollection)
      ) {
        setSelectedCollection("");
      }
    } catch (error) {
      setCollectionsError(
        getErrorMessage(error, "Unable to load database collections."),
      );
    } finally {
      setCollectionsLoading(false);
    }
  }, [selectedCollection]);

  const loadCollectionData = useCallback(
    async (collectionName: string, page = 1) => {
      if (!collectionName) {
        setOverview(null);
        setDocuments([]);
        return;
      }

      setDocumentsLoading(true);
      setDocumentsError("");

      try {
        const [overviewResponse, documentsResponse] = await Promise.all([
          apiFetch<{
            success: boolean;
            data: DatabaseCollectionOverview;
          }>(
            `/admin/database/collections/${encodeURIComponent(
              collectionName,
            )}/stats`,
          ),

          apiFetch<{
            success: boolean;
            data: DatabaseDocumentsResponse;
          }>(
            `/admin/database/collections/${encodeURIComponent(
              collectionName,
            )}/documents?page=${page}&limit=${PAGE_SIZE}&search=${encodeURIComponent(
              search,
            )}&sortBy=${encodeURIComponent(sortBy)}&sortOrder=${sortOrder}`,
          ),
        ]);

        setOverview(overviewResponse.data);
        setDocuments(documentsResponse.data.documents || []);
        setPagination(documentsResponse.data.pagination);
      } catch (error) {
        setDocumentsError(
          getErrorMessage(error, "Unable to load collection data."),
        );
      } finally {
        setDocumentsLoading(false);
      }
    },
    [search, sortBy, sortOrder],
  );

  useEffect(() => {
    loadCollections();
  }, [loadCollections]);

  useEffect(() => {
    if (!selectedCollection) return;

    setPagination((current) => ({
      ...current,
      page: 1,
    }));

    loadCollectionData(selectedCollection, 1);
  }, [selectedCollection, search, sortBy, sortOrder, loadCollectionData]);

  useEffect(() => {
    if (!modal) {
      document.body.style.overflow = "";
      return;
    }

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previous;
    };
  }, [modal]);

  async function handleRefresh() {
    setRefreshing(true);
    setPageError("");

    try {
      await loadCollections();

      if (selectedCollection) {
        await loadCollectionData(selectedCollection, pagination.page);
      }
    } catch {
      setPageError("Unable to refresh database information.");
    } finally {
      setRefreshing(false);
    }
  }

  async function handleOpenDocument(document: DatabaseDocument) {
    const id = getDocumentId(document);

    if (!id) {
      setPageError("This document does not have a valid MongoDB ID.");
      return;
    }

    try {
      const response = await apiFetch<{
        success: boolean;
        data: { document: DatabaseDocument };
      }>(
        `/admin/database/collections/${encodeURIComponent(
          selectedCollection,
        )}/documents/${encodeURIComponent(id)}`,
      );

      setSelectedDocument(response.data.document);
      setModal("view");
    } catch (error) {
      setPageError(getErrorMessage(error, "Unable to load this document."));
    }
  }

  async function handleOpenSchema() {
    if (!selectedCollection) return;

    setSchemaLoading(true);
    setSchemaError("");

    try {
      const response = await apiFetch<{
        success: boolean;
        data: DatabaseSchemaResponse;
      }>(
        `/admin/database/collections/${encodeURIComponent(
          selectedCollection,
        )}/schema?sampleSize=100`,
      );

      setSchema(response.data);
      setModal("schema");
    } catch (error) {
      setSchemaError(
        getErrorMessage(error, "Unable to load collection schema."),
      );
    } finally {
      setSchemaLoading(false);
    }
  }

  function openCreate() {
    setSelectedDocument(null);
    setModal("create");
  }

  function openEdit(document: DatabaseDocument) {
    setSelectedDocument(document);
    setModal("edit");
  }

  function openDelete(document: DatabaseDocument) {
    setSelectedDocument(document);
    setModal("delete");
  }

  function closeModal() {
    setModal(null);
    setSelectedDocument(null);
  }

  async function handleMutationComplete() {
    closeModal();

    if (selectedCollection) {
      await loadCollections();
      await loadCollectionData(selectedCollection, pagination.page);
    }
  }

  async function goToPage(page: number) {
    if (!selectedCollection) return;

    if (page < 1 || page > pagination.pages) return;

    await loadCollectionData(selectedCollection, page);
  }

  return (
    <div className="min-h-full bg-slate-50/50">
      <main className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {/* Header */}
        <section className="mb-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
                <DatabaseIcon className="h-4 w-4" />
                System administration
              </div>

              <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                Database
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
                Inspect collections, review documents, understand schemas and
                manage database records.
              </p>
            </div>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              <RefreshCw
                className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              />
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </section>

        {pageError ? (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{pageError}</span>
          </div>
        ) : null}

        {/* Summary */}
        <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            label="Collections"
            value={collectionsLoading ? "—" : formatNumber(collections.length)}
            icon={<DatabaseIcon className="h-5 w-5" />}
          />

          <SummaryCard
            label="Total documents"
            value={collectionsLoading ? "—" : formatNumber(totalDocuments)}
            icon={<FileJson className="h-5 w-5" />}
          />

          <SummaryCard
            label="Largest collection"
            value={largestCollection?.name || "—"}
            icon={<Server className="h-5 w-5" />}
            smallValue
          />

          <SummaryCard
            label="Selected collection"
            value={selectedCollection || "None"}
            icon={<ShieldCheck className="h-5 w-5" />}
            smallValue
          />
        </section>

        {/* Collections */}
        <section className={`${cardClass} mb-6 overflow-hidden`}>
          <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <h2 className="font-semibold text-slate-900">Collections</h2>
              <p className="mt-1 text-xs text-slate-500">
                Select a collection to inspect its records.
              </p>
            </div>

            <span className="text-xs font-medium text-slate-400">
              {formatNumber(collections.length)} collections
            </span>
          </div>

          {collectionsLoading ? (
            <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <div
                  key={index}
                  className="h-24 animate-pulse rounded-xl bg-slate-100"
                />
              ))}
            </div>
          ) : collectionsError ? (
            <div className="p-6">
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {collectionsError}
              </div>
            </div>
          ) : collections.length === 0 ? (
            <EmptyState
              title="No collections found"
              description="MongoDB did not return any visible collections."
            />
          ) : (
            <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {collections.map((collection) => {
                const selected = collection.name === selectedCollection;

                return (
                  <button
                    key={collection.name}
                    type="button"
                    onClick={() => setSelectedCollection(collection.name)}
                    className={`group flex min-h-[92px] items-center justify-between rounded-xl border p-4 text-left transition ${
                      selected
                        ? "border-emerald-300 bg-emerald-50/70 shadow-sm"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <DatabaseIcon
                          className={`h-4 w-4 shrink-0 ${
                            selected ? "text-emerald-600" : "text-slate-400"
                          }`}
                        />

                        <span className="truncate text-sm font-semibold text-slate-900">
                          {prettyCollectionName(collection.name)}
                        </span>
                      </div>

                      <p className="mt-2 pl-6 text-xs text-slate-500">
                        {formatNumber(collection.documents)} documents
                      </p>
                    </div>

                    <ChevronRight
                      className={`h-4 w-4 shrink-0 transition ${
                        selected
                          ? "text-emerald-600"
                          : "text-slate-300 group-hover:text-slate-500"
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Selected collection */}
        {selectedCollection ? (
          <section className={`${cardClass} overflow-hidden`}>
            <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate text-xl font-semibold text-slate-950">
                      {prettyCollectionName(selectedCollection)}
                    </h2>

                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500">
                      {selectedCollection}
                    </span>
                  </div>

                  <p className="mt-1 text-sm text-slate-500">
                    {overview
                      ? `${formatNumber(overview.documents)} documents`
                      : "Loading collection information..."}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleOpenSchema}
                    disabled={schemaLoading}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                  >
                    {schemaLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Code2 className="h-4 w-4" />
                    )}
                    Schema
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      loadCollectionData(selectedCollection, pagination.page)
                    }
                    disabled={documentsLoading}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${
                        documentsLoading ? "animate-spin" : ""
                      }`}
                    />
                    Refresh
                  </button>

                  {canWrite(role) ? (
                    <button
                      type="button"
                      onClick={openCreate}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"
                    >
                      <Plus className="h-4 w-4" />
                      Add document
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-3 lg:flex-row">
                <div className="relative min-w-0 flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search documents..."
                    className={`${inputClass} pl-10`}
                  />
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <div className="relative min-w-[180px]">
                    <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                    <select
                      value={sortBy}
                      onChange={(event) => setSortBy(event.target.value)}
                      className={`${inputClass} appearance-none pl-10`}
                    >
                      <option value="createdAt">Created At</option>
                      <option value="updatedAt">Updated At</option>
                      <option value="date">Date</option>
                      <option value="name">Name</option>
                      <option value="title">Title</option>
                      <option value="_id">ID</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setSortOrder((current) =>
                        current === "asc" ? "desc" : "asc",
                      )
                    }
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    {sortOrder === "asc" ? (
                      <ArrowUpAZ className="h-4 w-4" />
                    ) : (
                      <ArrowDownAZ className="h-4 w-4" />
                    )}
                    {sortOrder === "asc" ? "Ascending" : "Descending"}
                  </button>
                </div>
              </div>

              {documentsError ? (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {documentsError}
                </div>
              ) : null}

              {schemaError ? (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {schemaError}
                </div>
              ) : null}
            </div>

            {/* Documents */}
            {documentsLoading ? (
              <div className="space-y-3 p-5">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-16 animate-pulse rounded-xl bg-slate-100"
                  />
                ))}
              </div>
            ) : documents.length === 0 ? (
              <EmptyState
                title="No documents found"
                description={
                  search
                    ? "No documents match your search."
                    : "This collection does not contain any documents."
                }
                icon={<FileJson className="h-6 w-6" />}
              />
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-[900px] w-full">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/70">
                        <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                          Document
                        </th>
                        <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                          Fields
                        </th>
                        <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                          Created
                        </th>
                        <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {documents.map((document) => {
                        const id = getDocumentId(document);

                        const createdAt =
                          typeof document.createdAt === "string"
                            ? document.createdAt
                            : null;

                        return (
                          <tr
                            key={id}
                            className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60"
                          >
                            <td className="px-5 py-4">
                              <div className="flex min-w-0 items-center gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                                  <FileJson className="h-4 w-4" />
                                </div>

                                <div className="min-w-0">
                                  <p className="max-w-[360px] truncate font-mono text-xs font-medium text-slate-800">
                                    {id || "No ID"}
                                  </p>

                                  <p className="mt-1 text-xs text-slate-400">
                                    MongoDB document
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="px-5 py-4">
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                                <Hash className="h-3 w-3" />
                                {Object.keys(document).length} fields
                              </span>
                            </td>

                            <td className="px-5 py-4 text-sm text-slate-500">
                              {createdAt
                                ? new Date(createdAt).toLocaleString("en-IN", {
                                    dateStyle: "medium",
                                    timeStyle: "short",
                                  })
                                : "—"}
                            </td>

                            <td className="px-5 py-4">
                              <div className="flex justify-end gap-1">
                                <IconButton
                                  label="View document"
                                  onClick={() => handleOpenDocument(document)}
                                >
                                  <Eye className="h-4 w-4" />
                                </IconButton>

                                {canWrite(role) ? (
                                  <IconButton
                                    label="Edit document"
                                    onClick={() => openEdit(document)}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </IconButton>
                                ) : null}

                                {canDelete(role) ? (
                                  <IconButton
                                    label="Delete document"
                                    danger
                                    onClick={() => openDelete(document)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </IconButton>
                                ) : null}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-slate-500">
                    {pagination.total
                      ? `Showing ${Math.min(
                          (pagination.page - 1) * pagination.limit + 1,
                          pagination.total,
                        )}–${Math.min(
                          pagination.page * pagination.limit,
                          pagination.total,
                        )} of ${formatNumber(pagination.total)}`
                      : "No documents"}
                  </p>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={pagination.page <= 1}
                      onClick={() => goToPage(pagination.page - 1)}
                      className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </button>

                    <span className="min-w-[80px] text-center text-xs font-medium text-slate-500">
                      Page {pagination.page} of {Math.max(pagination.pages, 1)}
                    </span>

                    <button
                      type="button"
                      disabled={
                        pagination.page >= pagination.pages ||
                        pagination.pages === 0
                      }
                      onClick={() => goToPage(pagination.page + 1)}
                      className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </section>
        ) : null}
      </main>

      {/* View */}
      {modal === "view" && selectedDocument ? (
        <DocumentViewModal
          document={selectedDocument}
          collection={selectedCollection}
          onClose={closeModal}
          onEdit={
            canWrite(role)
              ? () => {
                  setModal("edit");
                }
              : undefined
          }
        />
      ) : null}

      {/* Create */}
      {modal === "create" ? (
        <DocumentEditorModal
          mode="create"
          collection={selectedCollection}
          onClose={closeModal}
          onComplete={handleMutationComplete}
        />
      ) : null}

      {/* Edit */}
      {modal === "edit" && selectedDocument ? (
        <DocumentEditorModal
          mode="edit"
          collection={selectedCollection}
          document={selectedDocument}
          onClose={closeModal}
          onComplete={handleMutationComplete}
        />
      ) : null}

      {/* Schema */}
      {modal === "schema" && schema ? (
        <SchemaModal schema={schema} onClose={closeModal} />
      ) : null}

      {/* Delete */}
      {modal === "delete" && selectedDocument ? (
        <DeleteModal
          collection={selectedCollection}
          document={selectedDocument}
          onClose={closeModal}
          onComplete={handleMutationComplete}
        />
      ) : null}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon,
  smallValue = false,
}: {
  label: string;
  value: string;
  icon: ReactNode;
  smallValue?: boolean;
}) {
  return (
    <div className={`${cardClass} p-5`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            {label}
          </p>

          <p
            className={`mt-4 truncate font-semibold tracking-tight text-slate-950 ${
              smallValue ? "text-lg" : "text-2xl"
            }`}
          >
            {value}
          </p>
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
          {icon}
        </div>
      </div>
    </div>
  );
}

function IconButton({
  children,
  label,
  onClick,
  danger = false,
}: {
  children: ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`flex h-9 w-9 items-center justify-center rounded-lg transition ${
        danger
          ? "text-red-400 hover:bg-red-50 hover:text-red-600"
          : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"
      }`}
    >
      {children}
    </button>
  );
}

function DocumentViewModal({
  document,
  collection,
  onClose,
  onEdit,
}: {
  document: DatabaseDocument;
  collection: string;
  onClose: () => void;
  onEdit?: () => void;
}) {
  const [copied, setCopied] = useState(false);

  async function copyJson() {
    try {
      await navigator.clipboard.writeText(JSON.stringify(document, null, 2));
      setCopied(true);

      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <ModalShell
      title="Document details"
      description={`${prettyCollectionName(collection)} collection`}
      onClose={onClose}
      wide
      footer={
        <>
          <button
            type="button"
            onClick={copyJson}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            {copied ? (
              <Check className="h-4 w-4 text-emerald-600" />
            ) : (
              <Clipboard className="h-4 w-4" />
            )}
            {copied ? "Copied" : "Copy JSON"}
          </button>

          {onEdit ? (
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-medium text-white hover:bg-slate-800"
            >
              <Pencil className="h-4 w-4" />
              Edit document
            </button>
          ) : null}

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Close
          </button>
        </>
      }
    >
      <div className="space-y-5 p-5 sm:p-6">
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            Document ID
          </p>

          <p className="mt-2 break-all font-mono text-sm text-slate-800">
            {getDocumentId(document)}
          </p>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">
              Document fields
            </h3>

            <span className="text-xs text-slate-400">
              {Object.keys(document).length} fields
            </span>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200">
            <div className="divide-y divide-slate-100">
              {Object.entries(document).map(([key, value]) => (
                <div
                  key={key}
                  className="grid gap-2 px-4 py-4 sm:grid-cols-[180px_minmax(0,1fr)]"
                >
                  <div className="font-mono text-xs font-semibold text-slate-500">
                    {key}
                  </div>

                  <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words font-mono text-xs leading-5 text-slate-700">
                    {formatValue(value)}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </ModalShell>
  );
}

function DocumentEditorModal({
  mode,
  collection,
  document,
  onClose,
  onComplete,
}: {
  mode: "create" | "edit";
  collection: string;
  document?: DatabaseDocument;
  onClose: () => void;
  onComplete: () => Promise<void>;
}) {
  const [value, setValue] = useState(JSON.stringify(document || {}, null, 2));

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    setError("");

    let parsed: unknown;

    try {
      parsed = JSON.parse(value);
    } catch {
      setError("Invalid JSON. Please correct the document before saving.");
      return;
    }

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      setError("The document must be a JSON object.");
      return;
    }

    setSubmitting(true);

    try {
      if (mode === "create") {
        await apiFetch(
          `/admin/database/collections/${encodeURIComponent(
            collection,
          )}/documents`,
          {
            method: "POST",
            body: JSON.stringify(parsed),
          },
        );
      } else {
        const id = document?._id;

        if (!id) {
          throw new Error("Document ID is missing.");
        }

        await apiFetch(
          `/admin/database/collections/${encodeURIComponent(
            collection,
          )}/documents/${encodeURIComponent(id)}`,
          {
            method: "PATCH",
            body: JSON.stringify(parsed),
          },
        );
      }

      await onComplete();
    } catch (error) {
      setError(
        getErrorMessage(
          error,
          mode === "create"
            ? "Unable to create document."
            : "Unable to update document.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ModalShell
      title={mode === "create" ? "Add document" : "Edit document"}
      description={
        mode === "create"
          ? `Create a new document in ${collection}.`
          : `Update the selected document in ${collection}.`
      }
      onClose={submitting ? () => undefined : onClose}
      wide
      footer={
        <>
          <button
            type="button"
            disabled={submitting}
            onClick={onClose}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={submitting}
            onClick={handleSubmit}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {mode === "create" ? "Creating..." : "Saving..."}
              </>
            ) : (
              <>
                {mode === "create" ? (
                  <FilePlus2 className="h-4 w-4" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                {mode === "create" ? "Create document" : "Save changes"}
              </>
            )}
          </button>
        </>
      }
    >
      <div className="space-y-4 p-5 sm:p-6">
        {error ? (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        <div className="rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-sm text-blue-700">
          Use valid JSON. MongoDB ObjectId and Date values should be supplied in
          the format expected by your backend/database.
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label
              htmlFor="database-document-json"
              className="text-sm font-semibold text-slate-800"
            >
              JSON document
            </label>

            <span className="text-xs text-slate-400">{collection}</span>
          </div>

          <textarea
            id="database-document-json"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            spellCheck={false}
            disabled={submitting}
            className="min-h-[420px] w-full resize-y rounded-xl border border-slate-200 bg-slate-950 px-4 py-4 font-mono text-xs leading-6 text-slate-100 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 disabled:opacity-60"
          />
        </div>
      </div>
    </ModalShell>
  );
}

function SchemaModal({
  schema,
  onClose,
}: {
  schema: DatabaseSchemaResponse;
  onClose: () => void;
}) {
  return (
    <ModalShell
      title="Collection schema"
      description={`Inferred from a sample of ${formatNumber(
        schema.sampledDocuments,
      )} documents.`}
      onClose={onClose}
      wide
      footer={
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Close
        </button>
      }
    >
      <div className="p-5 sm:p-6">
        <div className="mb-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
              Collection
            </p>
            <p className="mt-2 truncate text-sm font-semibold text-slate-900">
              {schema.collection}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
              Total documents
            </p>
            <p className="mt-2 text-lg font-semibold text-slate-900">
              {formatNumber(schema.totalDocuments)}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
              Fields detected
            </p>
            <p className="mt-2 text-lg font-semibold text-slate-900">
              {formatNumber(schema.fields.length)}
            </p>
          </div>
        </div>

        {schema.fields.length === 0 ? (
          <EmptyState
            title="No fields detected"
            description="The sampled collection did not contain any fields."
            icon={<Code2 className="h-6 w-6" />}
          />
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <div className="overflow-x-auto">
              <table className="min-w-[800px] w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                      Field
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                      Occurrences
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                      Examples
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {schema.fields.map((field) => (
                    <tr
                      key={field.field}
                      className="border-b border-slate-100 last:border-0"
                    >
                      <td className="px-4 py-4 align-top">
                        <span className="font-mono text-xs font-semibold text-slate-800">
                          {field.field}
                        </span>
                      </td>

                      <td className="px-4 py-4 align-top">
                        <div className="flex flex-wrap gap-1.5">
                          {field.types.map((type) => (
                            <span
                              key={type}
                              className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-700"
                            >
                              {type}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="px-4 py-4 align-top text-sm text-slate-600">
                        {formatNumber(field.occurrences)}
                      </td>

                      <td className="max-w-[420px] px-4 py-4 align-top">
                        <div className="space-y-2">
                          {field.examples.map((example, index) => (
                            <pre
                              key={`${field.field}-${index}`}
                              className="overflow-x-auto rounded-lg bg-slate-950 px-3 py-2 font-mono text-[11px] leading-5 text-slate-200"
                            >
                              {formatValue(example)}
                            </pre>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </ModalShell>
  );
}

function DeleteModal({
  collection,
  document,
  onClose,
  onComplete,
}: {
  collection: string;
  document: DatabaseDocument;
  onClose: () => void;
  onComplete: () => Promise<void>;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    const id = getDocumentId(document);

    if (!id) {
      setError("This document does not have a valid ID.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await apiFetch(
        `/admin/database/collections/${encodeURIComponent(
          collection,
        )}/documents/${encodeURIComponent(id)}`,
        {
          method: "DELETE",
        },
      );

      await onComplete();
    } catch (error) {
      setError(getErrorMessage(error, "Unable to delete this document."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ModalShell
      title="Delete document"
      description="This action cannot be undone."
      onClose={submitting ? () => undefined : onClose}
      footer={
        <>
          <button
            type="button"
            disabled={submitting}
            onClick={onClose}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={submitting}
            onClick={handleDelete}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Delete document
              </>
            )}
          </button>
        </>
      }
    >
      <div className="p-5 sm:p-6">
        <div className="flex items-start gap-4 rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
            <AlertTriangle className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <h3 className="font-semibold text-red-900">
              Permanently delete this document?
            </h3>

            <p className="mt-1 text-sm leading-6 text-red-700">
              The document will be removed from the{" "}
              <strong>{collection}</strong> collection and cannot be recovered
              through this admin panel.
            </p>
          </div>
        </div>

        {error ? (
          <div className="mt-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        ) : null}

        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            Document ID
          </p>

          <p className="mt-2 break-all font-mono text-xs text-slate-700">
            {getDocumentId(document)}
          </p>
        </div>
      </div>
    </ModalShell>
  );
}
