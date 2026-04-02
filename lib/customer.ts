export interface CustomerFormData {
  name: string;
  contact_name: string;
  phone: string;
  backup_phone: string;
  map_location: string;
  map_link: string;
  details: string;
  category_id: string;
}

export interface CustomerRecord extends CustomerFormData {
  id: string;
  handled_by_uid: string;
  created_at: any;
}

export const emptyCustomerFormData: CustomerFormData = {
  name: '',
  contact_name: '',
  phone: '',
  backup_phone: '',
  map_location: '',
  map_link: '',
  details: '',
  category_id: '',
};

const readString = (value: unknown): string => (typeof value === 'string' ? value : '');

export const normalizePhone = (value: string) => value.replace(/\D/g, '');

export const formatPhoneDisplay = (value: string) => {
  const digits = normalizePhone(value);

  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  if (digits.length === 9) {
    return `${digits.slice(0, 2)}-${digits.slice(2, 5)}-${digits.slice(5)}`;
  }

  return value;
};

export const hydrateCustomerFormData = (
  data: Record<string, unknown> | undefined | null
): CustomerFormData => ({
  name: readString(data?.name),
  contact_name: readString(data?.contact_name),
  phone: readString(data?.phone),
  backup_phone: readString(data?.backup_phone),
  map_location: readString(data?.map_location),
  map_link: readString(data?.map_link),
  details: readString(data?.details),
  category_id: readString(data?.category_id),
});
