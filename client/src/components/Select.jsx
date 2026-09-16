function Select({
  label,
  value,
  onChange,
  options,
  placeholder = "Select an option",
  required = false,
  disabled = false,
}) {
  return (
    <div>
      {label && (
        <label className="text-sm font-medium text-text">
          {label}
        </label>
      )}

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        disabled={disabled}
        className="mt-2 h-11 w-full rounded-lg border border-border bg-background px-3 text-sm text-text outline-none transition focus:border-primary disabled:cursor-not-allowed disabled:opacity-60"
      >
        {placeholder && (
          <option value="">
            {placeholder}
          </option>
        )}

        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default Select;