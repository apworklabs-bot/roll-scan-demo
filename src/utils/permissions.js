// src/utils/permissions.js

export const ROLES = {
  ADMIN: "ADMIN",
  GUIDE: "GUIDE",
  STAFF: "STAFF",
  PARTICIPANT: "PARTICIPANT",
};

// Μέχρι να μπει πραγματικό auth, παίζουμε με fake admin
export const FAKE_CURRENT_USER = {
  id: "fake-admin-1",
  fullName: "Tony Admin",
  email: "admin@basecamp.gr",
  role: ROLES.ADMIN,
  isActive: true,
};

// ---- Accounts permissions ----

export function canSeeAccountsPage(user) {
  return user?.role === ROLES.ADMIN;
}

export function canEditAccount(currentUser, targetAccount) {
  if (!currentUser || !targetAccount) return false;
  // Admin μπορεί να επεξεργαστεί όλους (συμπεριλαμβανομένου και του εαυτού του)
  return currentUser.role === ROLES.ADMIN;
}

export function canChangeRole(currentUser, targetAccount) {
  if (!currentUser) return false;
  // Admin μπορεί να αλλάξει ρόλο, εκτός από τον δικό του (για να μην αυτοκλειδωθεί)
  if (currentUser.role !== ROLES.ADMIN) return false;
  if (!targetAccount) return true;
  return targetAccount.id !== currentUser.id;
}

export function canToggleActive(currentUser, targetAccount) {
  if (!currentUser || !targetAccount) return false;
  // Admin μπορεί να ενεργοποιεί/απενεργοποιεί όλους εκτός από τον εαυτό του
  return currentUser.role === ROLES.ADMIN && targetAccount.id !== currentUser.id;
}

// Άλλες σελίδες που μπορεί να καλούν permissions (για να μην βγάζουν import errors)

export function canSeeInventoryPage(user) {
  // π.χ. Admin + Staff
  return user?.role === ROLES.ADMIN || user?.role === ROLES.STAFF;
}

// Αν έχεις άλλα helpers (canSeeReportsPage κλπ), μπορείς να τα προσθέσεις εδώ
