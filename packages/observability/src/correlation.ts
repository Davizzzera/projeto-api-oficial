import { v4 as uuidv4, validate } from 'uuid';

export const ensureCorrelationId = (id?: string | string[]): string => {
  const strId = Array.isArray(id) ? id[0] : id;
  if (strId && validate(strId)) {
    return strId;
  }
  return uuidv4();
};
