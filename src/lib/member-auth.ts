"use client";

export interface MemberAddress {
  id: string;
  title: string;
  city: string;
  district: string;
  neighborhood?: string;
  fullAddress: string;
}

export interface SpecialDate {
  id: string;
  title: string;
  date: string;
  recipientName: string;
  relationship?: string;
  note?: string;
}

export interface MemberUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  date?: string;
  status?: string;
  orders?: number;
  addresses?: MemberAddress[];
  specialDates?: SpecialDate[];
}

const STORAGE_KEY = "cicekce_customer_member";

export function getStoredMember(): MemberUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function setStoredMember(member: MemberUser) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(member));
    window.dispatchEvent(new Event("cicekce_auth_change"));
  } catch (e) {}
}

export function clearStoredMember() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event("cicekce_auth_change"));
  } catch (e) {}
}
