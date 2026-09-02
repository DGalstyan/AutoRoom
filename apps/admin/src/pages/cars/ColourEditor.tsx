import { useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import type { CarColour } from '@autoroom/api/client';
import { Alert, Box, Button, IconButton, Stack, TextField, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import ImageIcon from '@mui/icons-material/ImageOutlined';
import { useAuth } from '@/auth/AuthProvider';
import { errorMessage } from '@/lib/api';
import { useToast } from '@/components/ToastProvider';
import { brand } from '@/theme';

/**
 * Colour options for a made-to-order car.
 *
 * Enabled only for ON_ORDER. Every other condition describes a car that already
 * exists in one specific colour, so offering a choice would be offering
 * something that cannot be delivered — the API refuses it, and the editor says
 * so before the save does.
 */
export function ColourEditor({
  colours,
  onChange,
  enabled,
  readOnly,
  fieldErrors = {},
}: {
  colours: CarColour[];
  onChange: (colours: CarColour[]) => void;
  enabled: boolean;
  readOnly: boolean;
  /** Server-side `colors.<index>.<field>` errors, keyed the way the API reports them. */
  fieldErrors?: Record<string, string>;
}) {
  if (!enabled) {
    return (
      <Alert severity="info">
        Colour choices apply only to cars on order. Change the condition to “On order” to offer
        them.
      </Alert>
    );
  }

  function update(index: number, changes: Partial<CarColour>) {
    onChange(colours.map((colour, i) => (i === index ? { ...colour, ...changes } : colour)));
  }

  return (
    <Stack spacing={2}>
      {colours.length === 0 && (
        <Typography sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
          No colours offered yet.
        </Typography>
      )}

      {colours.map((colour, index) => (
        <ColourRow
          key={index}
          colour={colour}
          readOnly={readOnly}
          onChange={(changes) => update(index, changes)}
          onRemove={() => onChange(colours.filter((_, i) => i !== index))}
          fieldId={`colors.${index}`}
          nameError={fieldErrors[`colors.${index}.name`]}
          hexError={fieldErrors[`colors.${index}.hex`]}
        />
      ))}

      {!readOnly && (
        <Box>
          <Button
            onClick={() => onChange([...colours, { name: '', hex: '#FFFFFF', imageUrl: null }])}
            startIcon={<AddIcon />}
            size="small"
          >
            Add colour
          </Button>
        </Box>
      )}
    </Stack>
  );
}

function ColourRow({
  colour,
  readOnly,
  onChange,
  onRemove,
  fieldId,
  nameError,
  hexError,
}: {
  colour: CarColour;
  readOnly: boolean;
  onChange: (changes: Partial<CarColour>) => void;
  onRemove: () => void;
  /** This row's `colors.<index>` prefix — ids the Name/Hex fields as `field-<fieldId>.<key>`. */
  fieldId: string;
  nameError?: string;
  hexError?: string;
}) {
  const { api } = useAuth();
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useMutation({
    mutationFn: (file: File) => api.upload(file),
    onSuccess: (uploaded) => onChange({ imageUrl: uploaded.url }),
    onError: (error) => toast(errorMessage(error, 'Upload failed.'), 'error'),
  });

  const validHex = /^#[0-9a-fA-F]{6}$/.test(colour.hex);

  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={1.5}
      sx={{ alignItems: { sm: 'flex-start' } }}
    >
      <Box
        sx={{
          width: 56,
          height: 56,
          flex: 'none',
          borderRadius: 1.5,
          border: `1px solid ${brand.lineLight}`,
          bgcolor: validHex ? colour.hex : brand.surfaceLight,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {colour.imageUrl && (
          <Box
            component="img"
            src={colour.imageUrl}
            alt=""
            sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        )}
      </Box>

      <TextField
        id={`field-${fieldId}.name`}
        label="Name"
        value={colour.name}
        onChange={(event) => onChange({ name: event.target.value })}
        disabled={readOnly}
        size="small"
        error={Boolean(nameError)}
        helperText={nameError}
        sx={{ flex: 1, minWidth: 140 }}
      />

      <TextField
        id={`field-${fieldId}.hex`}
        label="Hex"
        value={colour.hex}
        onChange={(event) => onChange({ hex: event.target.value })}
        disabled={readOnly}
        error={!validHex || Boolean(hexError)}
        helperText={hexError ?? (validHex ? undefined : 'e.g. #9FB8A6')}
        size="small"
        sx={{ width: 150 }}
        slotProps={{
          input: {
            startAdornment: (
              <Box
                component="input"
                type="color"
                aria-label="Colour picker"
                value={validHex ? colour.hex : '#FFFFFF'}
                disabled={readOnly}
                onChange={(event) => onChange({ hex: event.target.value.toUpperCase() })}
                sx={{
                  width: 22,
                  height: 22,
                  mr: 1,
                  p: 0,
                  border: 'none',
                  borderRadius: '4px',
                  bgcolor: 'transparent',
                  cursor: readOnly ? 'default' : 'pointer',
                  '&::-webkit-color-swatch-wrapper': { p: 0 },
                  '&::-webkit-color-swatch': {
                    border: '1px solid #0000001F',
                    borderRadius: '4px',
                  },
                }}
              />
            ),
          },
        }}
      />

      {!readOnly && (
        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', pt: 0.25 }}>
          <Button
            onClick={() => inputRef.current?.click()}
            startIcon={<ImageIcon />}
            disabled={uploadMutation.isPending}
            size="small"
          >
            {uploadMutation.isPending ? 'Uploading…' : colour.imageUrl ? 'Replace' : 'Image'}
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) uploadMutation.mutate(file);
              event.target.value = '';
            }}
          />
          <IconButton
            onClick={onRemove}
            size="small"
            aria-label={`Remove ${colour.name || 'colour'}`}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>
      )}
    </Stack>
  );
}
