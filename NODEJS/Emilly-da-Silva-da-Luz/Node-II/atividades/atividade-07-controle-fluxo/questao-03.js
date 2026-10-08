function canSchedule(service, durationMinutes, professionalAvailable) {
  if (!service.active) return false;
  if (durationMinutes <= 0) return false;
  if (!professionalAvailable) return false;
  return true;
}

console.log(canSchedule({ active: true }, 45, true));
