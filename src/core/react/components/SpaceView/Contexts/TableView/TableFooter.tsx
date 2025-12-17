import React, { useCallback } from "react";
import classNames from "classnames";
import { SpaceTableColumn } from "shared/types/mdb";
import { Superstate } from "makemd-core";
import { windowFromDocument } from "shared/utils/dom";
import { aggregateFnTypes, calculateAggregate } from "core/utils/contexts/predicate/aggregates";
import { fieldTypeForField } from "schemas/mdb";
import { parseFieldValue } from "core/schemas/parseFieldValue";
import { safeFormatNumber } from "core/utils/number";
import { defaultMenu } from "core/react/components/UI/Menus/menu/SelectionMenu";
import { SelectOption } from "makemd-core";
import i18n from "shared/i18n";
import { DBRow } from "shared/types/mdb";

interface PredicateType {
  colsCalc?: Record<string, string>;
  [key: string]: unknown;
}

interface TableFooterProps {
  superstate: Superstate;
  cols: SpaceTableColumn[];
  colsSize: Record<string, number>;
  data: DBRow[];
  groupBy: string[];
  readMode: boolean;
  predicate: PredicateType;
  pageSize: number;
  onLoadMore: () => void;
  onNewRow: (name: string) => void;
  onSaveAggregate: (column: string, fn: string) => void;
}

/**
 * TableFooter component renders footer row using div grid layout
 * Replaces <tfoot> section from table
 * Includes: pagination, new row input, and aggregate calculations
 */
export const TableFooter: React.FC<TableFooterProps> = ({
  superstate,
  cols,
  colsSize,
  data,
  groupBy,
  readMode,
  predicate,
  pageSize,
  onLoadMore,
  onNewRow,
  onSaveAggregate,
}) => {
  const getCanNextPage = useCallback(() => {
    return data.length % pageSize === 0;
  }, [data, pageSize]);

  const valueForAggregate = useCallback(
    (value: string, agType: string, col: SpaceTableColumn) => {
      if (agType === "number") {
        const parsedValue = parseFieldValue(col.value, col.type);
        if (parsedValue?.format?.length > 0) {
          return safeFormatNumber(parsedValue.format, parseInt(value));
        }
      }
      return value;
    },
    []
  );

  const aggregateValues = React.useMemo(() => {
    const result: Record<string, string> = {};
    Object.keys(predicate?.colsCalc ?? {}).forEach((f) => {
      result[f] = calculateAggregate(
        superstate.settings,
        data.map((r) => r[f]),
        predicate.colsCalc[f],
        cols.find((c) => c.name === f)
      );
    });
    return result;
  }, [cols, data, predicate?.colsCalc, superstate.settings]);

  const handleAggregateClick = useCallback(
    (e: React.MouseEvent, col: SpaceTableColumn) => {
      const options: SelectOption[] = [];
      options.push({
        name: i18n.labels.none,
        value: "",
        onClick: () => {
          onSaveAggregate(col.name, "");
        },
      });

      Object.keys(aggregateFnTypes).forEach((f) => {
        if (
          aggregateFnTypes[f].type === fieldTypeForField(col) ||
          aggregateFnTypes[f].type === "any" ||
          col.type === "flex"
        ) {
          options.push({
            name: i18n.aggregates[f],
            value: f,
            onClick: () => {
              onSaveAggregate(col.name, f);
            },
          });
        }
      });

      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      superstate.ui.openMenu(
        rect,
        defaultMenu(superstate.ui, options),
        windowFromDocument(e.view?.document ?? document)
      );
    },
    [onSaveAggregate, superstate.ui]
  );

  const handleNewRowInput = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Enter") {
        const text = (e.currentTarget as HTMLElement).innerText;
        onNewRow(text);
        (e.currentTarget as HTMLElement).innerText = "";
        e.preventDefault();
      }
    },
    [onNewRow]
  );

  const handleNewRowFocus = useCallback(
    () => {
      // May want to clear selection state on focus
    },
    []
  );

  return (
    <div className="mk-footer">
      {/* Load More Pagination */}
      {getCanNextPage() && (
        <div
          className="mk-footer-row mk-footer-load-more"
          onClick={onLoadMore}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              onLoadMore();
            }
          }}
        >
          {i18n.buttons.loadMore}
        </div>
      )}

      {/* New Row Input */}
      {!readMode && (
        <div className="mk-footer-row mk-footer-new-row">
          <div
            className="mk-footer-input"
            data-placeholder={i18n.hintText.newItem}
            onFocus={handleNewRowFocus}
            onKeyDown={handleNewRowInput}
            contentEditable={true}
            suppressContentEditableWarning={true}
          />
        </div>
      )}

      {/* Aggregates Row */}
      <div className="mk-footer-row mk-footer-aggregates">
        <div className="mk-footer-spacer" />
        {/* Group by columns - empty cells */}
        {groupBy.map((_, i) => (
          <div key={`group-${i}`} className="mk-footer-cell mk-footer-cell-grouped" />
        ))}

        {/* Aggregate calculation cells */}
        {(groupBy.length > 0
          ? cols.filter((f) => !groupBy.includes(f.name))
          : cols
        ).map((col) => (
          <div
            key={`agg-${col.name}`}
            className={classNames(
              "mk-footer-cell mk-footer-cell-aggregate",
              !predicate?.colsCalc?.[col.name] && "mk-footer-cell-empty"
            )}
            style={{
              minWidth: colsSize[`${col.name}${col.table}`] ?? "50px",
              maxWidth: colsSize[`${col.name}${col.table}`] ?? "unset",
              flex: 0,
            }}
            onClick={(e) => handleAggregateClick(e, col)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                handleAggregateClick(e as React.KeyboardEvent<HTMLDivElement> as unknown as React.MouseEvent<HTMLDivElement>, col);
              }
            }}
          >
            {predicate?.colsCalc?.[col.name]?.length > 0 ? (
              <div className="mk-footer-aggregate-content">
                <span className="mk-footer-aggregate-label">
                  {i18n.aggregates[predicate.colsCalc[col.name]]}
                </span>
                <span className="mk-footer-aggregate-value">
                  {valueForAggregate(
                    aggregateValues[col.name],
                    aggregateFnTypes[predicate.colsCalc[col.name]]?.valueType,
                    col
                  )}
                </span>
              </div>
            ) : (
              <div className="mk-footer-aggregate-placeholder">
                <span>{i18n.labels.calculate}</span>
              </div>
            )}
          </div>
        ))}
        <div className="mk-footer-spacer" />
      </div>
    </div>
  );
};
