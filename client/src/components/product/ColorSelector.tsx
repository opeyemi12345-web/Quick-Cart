import type { ProductColor } from "../../types/api";

type ColorSelectorProps = {
  colors: ProductColor[];
  value: string;
  onChange: (name: string) => void;
};

const ColorSelector = ({ colors, value, onChange }: ColorSelectorProps) => (
  <fieldset>
    <legend className="mb-2 text-sm font-semibold text-ink">
      Color: {value}
    </legend>
    <div className="flex flex-wrap gap-2">
      {colors.map((color) => (
        <button
          key={color.name}
          type="button"
          onClick={() => onChange(color.name)}
          aria-label={color.name}
          aria-pressed={value === color.name}
          className={`flex size-9 items-center justify-center rounded-full border-2 ${
            value === color.name
              ? "border-primary"
              : "border-transparent hover:border-primary-light"
          }`}
        >
          <span
            aria-hidden="true"
            className="size-6 rounded-full border border-black/10"
            style={{ backgroundColor: color.hex }}
          />
        </button>
      ))}
    </div>
  </fieldset>
);

export default ColorSelector;
