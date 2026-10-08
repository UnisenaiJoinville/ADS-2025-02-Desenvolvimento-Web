function canSchedule(service, durationMinutes) {
  if (!service.active) return false;
  if (durationMinutes <= 0) return false;
  return true;
}

console.log(canSchedule({ active: true }, 45));
console.log(canSchedule({ active: false }, 45));
