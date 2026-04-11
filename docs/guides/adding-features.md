# Adding New Features

This guide outlines the process for adding new cleaning rules or features to the Text Cleaner.

## Adding a New Cleaning Rule

Adding a new rule involves updating the UI state, adding a toggle switch, and updating the text processing logic.

### 1. Update the State Interface
In `app/page.tsx`, locate the `options` state and add your new rule:
```typescript
const [options, setOptions] = useState({
  // ... existing options
  removeNumbers: false, // <-- Your new rule
});
```

### 2. Add the UI Toggle
In the `SidebarContent` component within `app/page.tsx`, add a new toggle switch for your rule inside the "Sanitization Rules" section:
```tsx
<label className="flex items-center justify-between p-4 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
  <div className="pr-4">
    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-200">Remove Numbers</p>
    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">Strip all numerical digits from the text.</p>
  </div>
  <div className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full">
    <input 
      type="checkbox" 
      className="peer sr-only" 
      checked={options.removeNumbers} 
      onChange={e => setOptions({...options, removeNumbers: e.target.checked})} 
    />
    <div className="h-6 w-11 rounded-full bg-neutral-200 dark:bg-neutral-700 peer-checked:bg-blue-600 transition-colors duration-200 ease-in-out"></div>
    <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transform transition-transform duration-200 ease-in-out peer-checked:translate-x-5"></div>
  </div>
</label>
```

### 3. Update the Processing Logic
In `lib/cleaner.ts`, update the string manipulation logic to apply your new rule when enabled:
```typescript
export async function cleanText(text: string, options: CleaningOptions) {
  let result = text;
  
  // ... existing logic ...

  if (options.removeNumbers) {
    result = result.replace(/[0-9]/g, '');
  }

  // ...
  return result;
}
```

### 4. Update Pending Changes Tracker
In `app/page.tsx`, update the `getPendingChanges` function so the UI knows when your new rule has been toggled since the last clean:
```typescript
const getPendingChanges = () => {
  // ...
  if (options.removeNumbers !== lastCleanedOptions.removeNumbers) {
    changes.push(`Remove Numbers ${options.removeNumbers ? 'enabled' : 'disabled'}`);
  }
  // ...
};
```

## Adding New Output Formats
If you want to add a new output format (e.g., JSON), you will need to:
1. Update the `format` type in the `options` state.
2. Add the format to the `Output Format` radio group in the UI.
3. Update `lib/cleaner.ts` to format the output accordingly.
4. Update the `handleCopy` and `handleDownload` functions to support the new MIME type or file extension.
