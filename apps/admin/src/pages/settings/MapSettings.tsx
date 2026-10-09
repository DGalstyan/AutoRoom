import type { SettingRecord } from '@autoroom/api/client';
import { Button, IconButton, Stack, TextField } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import { SectionCard } from '@/pages/settings/SectionCard';
import { useSettingSection } from '@/pages/settings/useSettingSection';

export function MapSettings({
  records,
  readOnly,
}: {
  records: SettingRecord[] | undefined;
  readOnly: boolean;
}) {
  const map = useSettingSection('home.mapLocations', records);
  if (!map.value) return null;
  const locations = map.value.locations;

  function update(index: number, changes: Partial<(typeof locations)[number]>) {
    map.patch({ locations: locations.map((l, i) => (i === index ? { ...l, ...changes } : l)) });
  }

  return (
    <Stack spacing={2.5} sx={{ maxWidth: 720 }}>
      <SectionCard
        title="Homepage map: where cars come from"
        description="Each place gets a pin on the homepage globe with a line to Yerevan. Use decimal coordinates (e.g. Dubai 25.2, 55.27)."
        dirty={map.dirty}
        saving={map.saving}
        readOnly={readOnly}
        onSave={map.save}
        onSaveAsync={map.saveAsync}
        onReset={map.reset}
      >
        <Stack spacing={1.5}>
          {locations.map((location, index) => (
            <Stack key={index} direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <TextField
                label="Name"
                value={location.name}
                onChange={(event) => update(index, { name: event.target.value })}
                error={Boolean(map.fieldErrors[`locations.${index}.name`])}
                helperText={map.fieldErrors[`locations.${index}.name`]}
                disabled={readOnly}
                fullWidth
              />
              <TextField
                label="Latitude"
                type="number"
                value={location.lat}
                onChange={(event) => update(index, { lat: Number(event.target.value) })}
                error={Boolean(map.fieldErrors[`locations.${index}.lat`])}
                disabled={readOnly}
                sx={{ width: 150 }}
              />
              <TextField
                label="Longitude"
                type="number"
                value={location.lng}
                onChange={(event) => update(index, { lng: Number(event.target.value) })}
                error={Boolean(map.fieldErrors[`locations.${index}.lng`])}
                disabled={readOnly}
                sx={{ width: 150 }}
              />
              {!readOnly && (
                <IconButton
                  onClick={() => map.patch({ locations: locations.filter((_, i) => i !== index) })}
                  aria-label={`Remove ${location.name || 'location'}`}
                  size="small"
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              )}
            </Stack>
          ))}
          {!readOnly && (
            <Button
              onClick={() => map.patch({ locations: [...locations, { name: '', lat: 0, lng: 0 }] })}
              startIcon={<AddIcon />}
              size="small"
              sx={{ alignSelf: 'flex-start' }}
            >
              Add location
            </Button>
          )}
        </Stack>
      </SectionCard>
    </Stack>
  );
}
