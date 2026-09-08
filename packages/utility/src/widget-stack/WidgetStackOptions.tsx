'use client';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  FormInput,
  FormSelect,
  SchemaOptionsForm,
  buildWidgetInitialProps,
  getAllWidgets,
  getWidget,
  useNestedWidgetEditor,
} from '@firstform/campus-hub-widget-sdk';
import type { WidgetDefinition, WidgetOptionsProps } from '@firstform/campus-hub-widget-sdk';
import type { ChildWidgetDef } from './WidgetStack';
import { AppIcon } from '@firstform/campus-hub-widget-sdk';

interface WidgetStackData {
  rotationSeconds: number;
  animationMode: string;
  children: ChildWidgetDef[];
}

const ANIMATION_MODES = [
  { value: 'fade', label: 'Fade' },
  { value: 'stack', label: 'Stack' },
  { value: 'carousel', label: 'Carousel' },
];

// Prevent recursion and exclude widgets that need full width
const EXCLUDED_TYPES = new Set(['widget-stack', 'news-ticker']);

function readState(data: Record<string, unknown> | undefined): WidgetStackData {
  return {
    rotationSeconds: (data?.rotationSeconds as number) ?? 8,
    animationMode: (data?.animationMode as string) ?? 'fade',
    children: (data?.children as ChildWidgetDef[]) ?? [],
  };
}

/** Case-insensitive match against everything a user might type to find a widget. */
function matchesQuery(widget: WidgetDefinition, query: string): boolean {
  if (!query) return true;
  const haystack = [widget.name, widget.description, widget.type, ...(widget.tags ?? [])]
    .join(' ')
    .toLowerCase();
  return query
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => haystack.includes(term));
}

/** Whether the inline fallback has any form to show for this child. */
function hasInlineOptions(def: WidgetDefinition | undefined): boolean {
  if (!def) return false;
  return Boolean(def.OptionsComponent) || (def.optionsSchema?.length ?? 0) > 0;
}

export default function WidgetStackOptions({ data, onChange }: WidgetOptionsProps) {
  const [state, setState] = useState<WidgetStackData>(() => readState(data));
  const [expandedChildId, setExpandedChildId] = useState<string | null>(null);
  const [showAddPicker, setShowAddPicker] = useState(false);

  // The host editor (when it supports it) drills into a child's full editor —
  // data sources, schema form, live preview — instead of squeezing the child's
  // form into this panel. Older hosts get the inline fallback below.
  const openNestedEditor = useNestedWidgetEditor();

  // Latest state for callbacks that outlive a render (the nested editor's
  // apply fires after the user has been away from this form for a while).
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    if (data) {
      setState(readState(data));
    }
  }, [data]);

  const propagate = useCallback(
    (newState: WidgetStackData) => {
      stateRef.current = newState;
      setState(newState);
      onChange(newState as unknown as Record<string, unknown>);
    },
    [onChange]
  );

  const handleTopLevelChange = (name: string, value: string | number | boolean) => {
    propagate({ ...state, [name]: value });
  };

  const updateChildProps = useCallback(
    (id: string, newProps: Record<string, unknown>) => {
      const current = stateRef.current;
      propagate({
        ...current,
        children: current.children.map((c) => (c.id === id ? { ...c, props: newProps } : c)),
      });
    },
    [propagate]
  );

  const configureChild = useCallback(
    (child: ChildWidgetDef, index: number, total: number) => {
      if (openNestedEditor) {
        openNestedEditor({
          widgetType: child.type,
          data: child.props ?? {},
          context: `Widget ${index + 1} of ${total}`,
          onApply: (newProps) => updateChildProps(child.id, newProps),
        });
        return;
      }
      setExpandedChildId((current) => (current === child.id ? null : child.id));
    },
    [openNestedEditor, updateChildProps]
  );

  const addChild = (type: string) => {
    const widgetDef = getWidget(type);
    const newChild: ChildWidgetDef = {
      id: `${type}-${Date.now()}`,
      type,
      props: widgetDef ? buildWidgetInitialProps(widgetDef) : {},
    };
    const total = state.children.length + 1;
    propagate({ ...state, children: [...state.children, newChild] });
    setShowAddPicker(false);
    // Straight into the new widget's settings: that is nearly always the next step.
    configureChild(newChild, total - 1, total);
  };

  const removeChild = (id: string) => {
    propagate({ ...state, children: state.children.filter((c) => c.id !== id) });
    if (expandedChildId === id) setExpandedChildId(null);
  };

  const moveChild = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= state.children.length) return;
    const newChildren = [...state.children];
    [newChildren[index], newChildren[newIndex]] = [newChildren[newIndex], newChildren[index]];
    propagate({ ...state, children: newChildren });
  };

  const availableWidgets = useMemo(
    () =>
      getAllWidgets()
        .filter((w) => !EXCLUDED_TYPES.has(w.type))
        .sort((a, b) => a.name.localeCompare(b.name)),
    []
  );

  return (
    <div className="space-y-6">
      {/* Display Settings */}
      <div className="space-y-4">
        <h3 className="font-semibold text-[var(--ui-text)]">Display Settings</h3>

        <FormSelect
          label="Animation Mode"
          name="animationMode"
          value={state.animationMode}
          options={ANIMATION_MODES}
          onChange={handleTopLevelChange}
        />

        <div className="text-sm text-[var(--ui-text-muted)]">
          {state.animationMode === 'fade' && 'Crossfade between widgets with a progress bar.'}
          {state.animationMode === 'stack' && 'Stacked cards with rotation. Active widget shuffles to the top.'}
          {state.animationMode === 'carousel' && '3D perspective carousel. Widgets fan out with depth.'}
        </div>

        <FormInput
          label="Rotation Speed (seconds)"
          name="rotationSeconds"
          type="number"
          value={state.rotationSeconds}
          min={3}
          max={120}
          onChange={handleTopLevelChange}
        />

        <div className="text-sm text-[var(--ui-text-muted)]">
          Each widget displays for {state.rotationSeconds} seconds before advancing.
        </div>
      </div>

      {/* Child Widgets */}
      <div className="space-y-4 border-t border-[color:var(--ui-item-border)] pt-6">
        <div>
          <h3 className="font-semibold text-[var(--ui-text)]">
            Widgets ({state.children.length})
          </h3>
          <p className="mt-1 text-xs text-[var(--ui-text-muted)]">
            {openNestedEditor
              ? 'Each widget has the same settings here as it does on its own. Select one to configure it.'
              : 'Select a widget to configure it.'}
          </p>
        </div>

        {state.children.length === 0 && (
          <div className="text-sm text-[var(--ui-text-muted)] py-4 text-center">
            No widgets added yet. Click &quot;Add Widget&quot; below.
          </div>
        )}

        {state.children.map((child, index) => {
          const childDef = getWidget(child.type);
          const isExpanded = !openNestedEditor && expandedChildId === child.id;
          const canConfigure = Boolean(openNestedEditor) || hasInlineOptions(childDef);
          const ChildOptions = childDef?.OptionsComponent;
          const childSchema = childDef?.optionsSchema;

          return (
            <div
              key={child.id}
              className="border border-[color:var(--ui-item-border)] rounded-lg overflow-hidden"
            >
              {/* Child header row */}
              <div className="flex items-center gap-1 pl-3 pr-1 py-1.5 bg-[var(--ui-item-bg)]">
                <button
                  type="button"
                  onClick={() => configureChild(child, index, state.children.length)}
                  disabled={!canConfigure}
                  className="flex min-w-0 flex-1 items-center gap-2 py-1 text-left disabled:cursor-default"
                  title={canConfigure ? `Configure ${childDef?.name ?? child.type}` : undefined}
                >
                  {childDef && (
                    <AppIcon
                      name={childDef.icon}
                      className="w-4 h-4 text-[var(--ui-text-muted)] flex-shrink-0"
                    />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-[var(--ui-text)]">
                      {childDef?.name ?? child.type}
                    </span>
                    {!childDef && (
                      <span className="block text-xs text-red-500">Unknown widget type</span>
                    )}
                  </span>
                </button>

                {/* Move up */}
                <button
                  onClick={() => moveChild(index, -1)}
                  disabled={index === 0}
                  className="p-1 text-[var(--ui-text-muted)] hover:text-[var(--ui-text)] disabled:opacity-30 transition-colors"
                  title="Move up"
                  aria-label="Move up"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </button>

                {/* Move down */}
                <button
                  onClick={() => moveChild(index, 1)}
                  disabled={index === state.children.length - 1}
                  className="p-1 text-[var(--ui-text-muted)] hover:text-[var(--ui-text)] disabled:opacity-30 transition-colors"
                  title="Move down"
                  aria-label="Move down"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Configure */}
                {canConfigure && (
                  <button
                    onClick={() => configureChild(child, index, state.children.length)}
                    className="p-1 text-[var(--ui-text-muted)] hover:text-[var(--ui-text)] transition-colors"
                    title={isExpanded ? 'Collapse' : 'Configure'}
                    aria-label={`Configure ${childDef?.name ?? child.type}`}
                    aria-expanded={openNestedEditor ? undefined : isExpanded}
                  >
                    {openNestedEditor ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    ) : (
                      <svg
                        className="w-4 h-4 transition-transform duration-200"
                        style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                  </button>
                )}

                {/* Remove */}
                <button
                  onClick={() => removeChild(child.id)}
                  className="p-1 text-red-400 hover:text-red-300 transition-colors"
                  title="Remove"
                  aria-label={`Remove ${childDef?.name ?? child.type}`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Inline fallback for hosts without a nested editor */}
              {isExpanded && childDef && (
                <div className="p-4 border-t border-[color:var(--ui-item-border)] bg-[var(--ui-panel-soft)]">
                  {ChildOptions ? (
                    <ChildOptions
                      data={child.props ?? {}}
                      onChange={(newData) => updateChildProps(child.id, newData)}
                    />
                  ) : childSchema && childSchema.length > 0 ? (
                    <SchemaOptionsForm
                      schema={childSchema}
                      data={child.props ?? {}}
                      onChange={(newData) => updateChildProps(child.id, newData)}
                    />
                  ) : null}
                </div>
              )}
            </div>
          );
        })}

        {/* Add Widget */}
        <div className="relative">
          <button
            onClick={() => setShowAddPicker(!showAddPicker)}
            aria-expanded={showAddPicker}
            className="w-full py-2 px-4 rounded-lg border-2 border-dashed border-[color:var(--ui-item-border)] text-[var(--ui-text-muted)] hover:border-[var(--ui-text)] hover:text-[var(--ui-text)] transition-colors text-sm"
          >
            + Add Widget
          </button>

          {showAddPicker && (
            <AddWidgetPicker
              widgets={availableWidgets}
              onPick={addChild}
              onClose={() => setShowAddPicker(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function AddWidgetPicker({
  widgets,
  onPick,
  onClose,
}: {
  widgets: WidgetDefinition[];
  onPick: (type: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const normalized = query.trim().toLowerCase();
  const filtered = useMemo(
    () => widgets.filter((w) => matchesQuery(w, normalized)),
    [widgets, normalized]
  );

  return (
    <div className="mt-2 border border-[color:var(--ui-item-border)] rounded-lg bg-[var(--ui-panel-solid)] overflow-hidden">
      <div className="relative border-b border-[color:var(--ui-item-border)] p-2">
        <svg
          className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ui-text-muted)]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" strokeWidth={2} />
          <path strokeLinecap="round" strokeWidth={2} d="M20 20l-3.5-3.5" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.preventDefault();
              if (query) setQuery('');
              else onClose();
            } else if (event.key === 'Enter' && filtered.length === 1) {
              event.preventDefault();
              onPick(filtered[0].type);
            }
          }}
          placeholder="Search widgets…"
          aria-label="Search widgets"
          className="w-full rounded-md bg-[var(--ui-input-bg)] py-2 pl-9 pr-8 text-sm text-[var(--ui-text)] placeholder:text-[var(--ui-text-muted)] outline-none focus:ring-2"
          style={{ border: '1px solid var(--ui-input-border)' }}
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded p-0.5 text-[var(--ui-text-muted)] hover:text-[var(--ui-text)]"
            aria-label="Clear search"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <div className="max-h-60 overflow-y-auto" role="listbox" aria-label="Available widgets">
        {filtered.map((w) => (
          <button
            key={w.type}
            role="option"
            aria-selected={false}
            onClick={() => onPick(w.type)}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--ui-text)] hover:bg-[var(--ui-item-hover)] transition-colors"
          >
            <AppIcon
              name={w.icon}
              className="w-4 h-4 text-[var(--ui-text-muted)] flex-shrink-0"
            />
            <div className="min-w-0 text-left">
              <div className="font-medium">{w.name}</div>
              <div className="truncate text-xs text-[var(--ui-text-muted)]">{w.description}</div>
            </div>
          </button>
        ))}
        {filtered.length === 0 && (
          <div className="px-4 py-6 text-center text-sm text-[var(--ui-text-muted)]">
            No widgets match &ldquo;{query.trim()}&rdquo;.
          </div>
        )}
      </div>
    </div>
  );
}
