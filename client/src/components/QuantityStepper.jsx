import { LuMinus, LuPlus } from 'react-icons/lu';

const QuantityStepper = ({ value, onChange, min = 1, max = 99 }) => (
    <div className="inline-flex items-center gap-1 border border-border-interactive rounded-full p-1">
        <button
            type="button"
            aria-label="Decrease quantity"
            disabled={value <= min}
            onClick={() => onChange(value - 1)}
            className="size-11 grid place-items-center rounded-full cursor-pointer
                       text-text-muted hover:text-text hover:bg-surface
                       disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-200"
        >
            <LuMinus size={15} />
        </button>
        <span aria-live="polite" className="w-8 text-center text-sm tabular-nums">{value}</span>
        <button
            type="button"
            aria-label="Increase quantity"
            disabled={value >= max}
            onClick={() => onChange(value + 1)}
            className="size-11 grid place-items-center rounded-full cursor-pointer
                       text-text-muted hover:text-text hover:bg-surface
                       disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-200"
        >
            <LuPlus size={15} />
        </button>
    </div>
);

export default QuantityStepper;
