let version = 0;
export const cacheVersion = () => version;
export const invalidateReports = () => {
  version++;
};
