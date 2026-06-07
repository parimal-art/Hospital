import dayjs from 'dayjs';

export const formatDate = (
  date,
  format = 'DD MMM YYYY'
) => {
  if (!date) return '-';

  const fmt =
    typeof format === 'string'
      ? format
      : 'DD MMM YYYY';

  return dayjs(date).format(fmt);
};

export const formatDateTime = (date) =>
  formatDate(date, 'DD MMM YYYY, hh:mm A');