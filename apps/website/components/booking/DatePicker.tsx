"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type DatePickerProps = {
    value?: string;
    onChange?: (value: string) => void;
    minDate?: string;
    maxDate?: string;
};

function formatDate(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function parseDate(value: string) {
    const [year, month, day] = value.split("-").map(Number);

    return new Date(year, month - 1, day);
}

function formatDateLabel(value: string) {
    if (!value) {
        return "Selecione uma data";
    }

    const date = parseDate(value);

    return new Intl.DateTimeFormat("pt-PT", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(date);
}

export default function DatePicker({
    value = "",
    onChange,
    minDate,
    maxDate,
}: DatePickerProps) {
    const initialDate = value
        ? parseDate(value)
        : minDate
          ? parseDate(minDate)
          : new Date();

    const [open, setOpen] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(
        new Date(
            initialDate.getFullYear(),
            initialDate.getMonth(),
            1
        )
    );

    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                containerRef.current &&
                !containerRef.current.contains(
                    event.target as Node
                )
            ) {
                setOpen(false);
            }
        }

        document.addEventListener(
            "mousedown",
            handleClickOutside
        );

        return () => {
            document.removeEventListener(
                "mousedown",
                handleClickOutside
            );
        };
    }, []);

    const days = useMemo(() => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        const firstWeekday =
            (firstDay.getDay() + 6) % 7;

        const totalDays = lastDay.getDate();

        const result: Array<Date | null> = [];

        for (let i = 0; i < firstWeekday; i++) {
            result.push(null);
        }

        for (let day = 1; day <= totalDays; day++) {
            result.push(new Date(year, month, day));
        }

        return result;
    }, [currentMonth]);

    const today = formatDate(new Date());

    function isDisabled(date: Date) {
        const value = formatDate(date);

        if (minDate && value < minDate) {
            return true;
        }

        if (maxDate && value > maxDate) {
            return true;
        }

        return false;
    }

    function selectDate(date: Date) {
        if (isDisabled(date)) {
            return;
        }

        const selected = formatDate(date);

        onChange?.(selected);
        setOpen(false);
    }

    function previousMonth() {
        setCurrentMonth(
            new Date(
                currentMonth.getFullYear(),
                currentMonth.getMonth() - 1,
                1
            )
        );
    }

    function nextMonth() {
        setCurrentMonth(
            new Date(
                currentMonth.getFullYear(),
                currentMonth.getMonth() + 1,
                1
            )
        );
    }

    const monthLabel = new Intl.DateTimeFormat(
        "pt-PT",
        {
            month: "long",
            year: "numeric",
        }
    ).format(currentMonth);

    const previousDisabled =
        !!minDate &&
        formatDate(
            new Date(
                currentMonth.getFullYear(),
                currentMonth.getMonth() - 1,
                1
            )
        ) <
            minDate.substring(0, 7) + "-01";

    const nextDisabled =
        !!maxDate &&
        formatDate(
            new Date(
                currentMonth.getFullYear(),
                currentMonth.getMonth() + 1,
                1
            )
        ) >
            maxDate.substring(0, 7) + "-01";

    return (
        <div
            ref={containerRef}
            className="relative"
        >
            <button
                type="button"
                onClick={() => setOpen((current) => !current)}
                className="flex w-full items-center justify-between rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-left text-white outline-none transition hover:border-slate-600 focus:border-cyan-400"
            >
                <span
                    className={
                        value
                            ? "text-white"
                            : "text-slate-500"
                    }
                >
                    {formatDateLabel(value)}
                </span>

                <span className="text-lg">
                    📅
                </span>
            </button>

            {open && (
                <div className="absolute left-0 top-full z-50 mt-2 w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 p-4 shadow-2xl">
                    <div className="mb-4 flex items-center justify-between">
                        <button
                            type="button"
                            onClick={previousMonth}
                            disabled={previousDisabled}
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-lg text-slate-300 transition hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                        >
                            ‹
                        </button>

                        <p className="font-bold capitalize text-white">
                            {monthLabel}
                        </p>

                        <button
                            type="button"
                            onClick={nextMonth}
                            disabled={nextDisabled}
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-lg text-slate-300 transition hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                        >
                            ›
                        </button>
                    </div>

                    <div className="mb-2 grid grid-cols-7 text-center text-xs font-semibold uppercase text-slate-500">
                        <span>Seg</span>
                        <span>Ter</span>
                        <span>Qua</span>
                        <span>Qui</span>
                        <span>Sex</span>
                        <span>Sáb</span>
                        <span>Dom</span>
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                        {days.map((date, index) => {
                            if (!date) {
                                return (
                                    <div
                                        key={`empty-${index}`}
                                        className="h-10"
                                    />
                                );
                            }

                            const dateValue =
                                formatDate(date);

                            const disabled =
                                isDisabled(date);

                            const selected =
                                value === dateValue;

                            const isToday =
                                today === dateValue;

                            return (
                                <button
                                    key={dateValue}
                                    type="button"
                                    disabled={disabled}
                                    onClick={() =>
                                        selectDate(date)
                                    }
                                    className={[
                                        "h-10 rounded-lg text-sm font-semibold transition",
                                        disabled
                                            ? "cursor-not-allowed text-slate-700"
                                            : "text-slate-300 hover:bg-slate-800 hover:text-white",
                                        selected
                                            ? "bg-cyan-500 text-slate-950 hover:bg-cyan-400"
                                            : "",
                                        !selected &&
                                        isToday
                                            ? "ring-1 ring-cyan-400"
                                            : "",
                                    ].join(" ")}
                                >
                                    {date.getDate()}
                                </button>
                            );
                        })}
                    </div>

                    <div className="mt-4 border-t border-slate-800 pt-3 text-xs text-slate-500">
                        Escolha uma data disponível para a marcação.
                    </div>
                </div>
            )}
        </div>
    );
}