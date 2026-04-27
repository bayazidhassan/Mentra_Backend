export type TProfilePayload = {
  name?: string;
  phone?: string;

  // raw formData values
  skills?: string; // JSON string
  bio?: string;
  experience?: string;
  hourlyRate?: string; // comes as string
  availability?: string; // JSON string
};
