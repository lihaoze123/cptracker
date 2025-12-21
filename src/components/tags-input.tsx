import { useState, useMemo, useCallback, useRef } from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface TagsInputProps {
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  placeholder?: string;
  disabled?: boolean;
}

export function TagsInput({
  value,
  onChange,
  suggestions,
  placeholder = "Add tags...",
  disabled = false,
}: TagsInputProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Parse comma-separated string to array
  const tags = useMemo(() => {
    return value
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  }, [value]);

  // Filter suggestions based on current tags and input
  const filteredSuggestions = useMemo(() => {
    const lowerTags = tags.map((t) => t.toLowerCase());
    const lowerInput = inputValue.toLowerCase();
    return suggestions
      .filter((s) => !lowerTags.includes(s.toLowerCase()))
      .filter((s) => s.toLowerCase().includes(lowerInput));
  }, [suggestions, tags, inputValue]);

  const addTag = useCallback(
    (tag: string) => {
      const trimmed = tag.trim();
      if (trimmed && !tags.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
        const newTags = [...tags, trimmed];
        onChange(newTags.join(", "));
      }
      setInputValue("");
      setOpen(false);
    },
    [tags, onChange]
  );

  const removeTag = useCallback(
    (tagToRemove: string) => {
      const newTags = tags.filter((t) => t !== tagToRemove);
      onChange(newTags.join(", "));
    },
    [tags, onChange]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === "Enter" || e.key === ",") && inputValue.trim()) {
      e.preventDefault();
      addTag(inputValue);
    }
    if (e.key === "Backspace" && !inputValue && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      <PopoverTrigger asChild>
        <div
          className="flex min-h-9 w-full flex-wrap items-center gap-1 rounded-none border border-input bg-transparent px-2 py-1 text-sm transition-colors focus-within:ring-1 focus-within:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() => inputRef.current?.focus()}
        >
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1 pr-1">
              {tag}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-4 p-0 hover:bg-transparent"
                onClick={(e) => {
                  e.stopPropagation();
                  removeTag(tag);
                }}
                disabled={disabled}
              >
                <X className="size-3" />
              </Button>
            </Badge>
          ))}
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              if (e.target.value) setOpen(true);
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => setOpen(true)}
            placeholder={tags.length === 0 ? placeholder : ""}
            className="flex-1 min-w-20 bg-transparent outline-none placeholder:text-muted-foreground"
            disabled={disabled}
          />
        </div>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Command>
          <CommandList>
            <CommandEmpty>
              {inputValue ? (
                <button
                  type="button"
                  className="w-full px-2 py-1.5 text-left text-sm hover:bg-accent"
                  onClick={() => addTag(inputValue)}
                >
                  Add "{inputValue}"
                </button>
              ) : (
                "Type to add a tag"
              )}
            </CommandEmpty>
            <CommandGroup>
              {filteredSuggestions.slice(0, 10).map((suggestion) => (
                <CommandItem
                  key={suggestion}
                  value={suggestion}
                  onSelect={() => addTag(suggestion)}
                >
                  {suggestion}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
