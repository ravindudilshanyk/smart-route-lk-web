export function hasCompleteProfile(user) {
  return !!(
    user &&
    user.nic &&
    user.whatsapp_number &&
    user.date_of_birth &&
    user.gender
  );
}
