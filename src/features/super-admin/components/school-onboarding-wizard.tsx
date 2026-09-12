"use client";

import { useState } from "react";
import { Building2, UserPlus, ArrowRight, ArrowLeft, CheckCircle2, ShieldAlert } from "lucide-react";
import { createSchoolWithAdminAction } from "@/features/super-admin/advanced-actions";

export function SchoolOnboardingWizard() {
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1 state
  const [name, setName] = useState("");
  const [npsn, setNpsn] = useState("");
  const [educationLevel, setEducationLevel] = useState("SMA/MA");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [address, setAddress] = useState("");

  // Step 2 state
  const [adminFullName, setAdminFullName] = useState("");
  const [adminUsername, setAdminUsername] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  const isStep1Valid = name.trim().length > 0;
  const isStep2Valid =
    adminFullName.trim().length > 0 &&
    adminUsername.trim().length > 0 &&
    adminEmail.trim().length > 0 &&
    adminPassword.length >= 6;

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      {/* Wizard Progress Steps */}
      <div className="border-b bg-muted/40 p-4 sm:p-6">
        <div className="flex items-center justify-between max-w-xl mx-auto">
          <div className="flex items-center gap-3">
            <div
              className={`flex size-9 items-center justify-center rounded-full font-semibold text-sm transition-colors ${
                step === 1
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-emerald-600 text-white"
              }`}
            >
              {step > 1 ? <CheckCircle2 className="size-5" /> : "1"}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Langkah 1
              </p>
              <p className="text-sm font-medium">Profil Sekolah</p>
            </div>
          </div>

          <div className="h-0.5 w-16 sm:w-28 bg-border" />

          <div className="flex items-center gap-3">
            <div
              className={`flex size-9 items-center justify-center rounded-full font-semibold text-sm transition-colors ${
                step === 2
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground border"
              }`}
            >
              2
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Langkah 2
              </p>
              <p className="text-sm font-medium">Akun Admin Utama</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Form */}
      <form action={createSchoolWithAdminAction} className="p-4 sm:p-8 space-y-6">
        {step === 1 && (
          <div className="space-y-6">
            <div className="flex items-center gap-2.5 pb-2 border-b">
              <Building2 className="size-5 text-primary" />
              <div>
                <h3 className="font-semibold text-base">Identitas & Informasi Lembaga</h3>
                <p className="text-xs text-muted-foreground">
                  Isi data profil sekolah yang akan terdaftar pada platform.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-medium text-foreground">
                  Nama Sekolah <span className="text-red-500">*</span>
                </label>
                <input
                  name="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: SMA Negeri 1 Sagaya"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">NPSN</label>
                <input
                  name="npsn"
                  value={npsn}
                  onChange={(e) => setNpsn(e.target.value)}
                  placeholder="8 Digit NPSN (Opsional)"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Jenjang Pendidikan</label>
                <select
                  name="education_level"
                  value={educationLevel}
                  onChange={(e) => setEducationLevel(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="SD/MI">SD/MI</option>
                  <option value="SMP/MTs">SMP/MTs</option>
                  <option value="SMA/MA">SMA/MA</option>
                  <option value="SMK/MAK">SMK/MAK</option>
                  <option value="PKBM">PKBM</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Email Sekolah</label>
                <input
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@sman1sagaya.sch.id"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Nomor Telepon</label>
                <input
                  name="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0812-xxxx-xxxx"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Kabupaten / Kota</label>
                <input
                  name="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Contoh: Jakarta Selatan"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Provinsi</label>
                <input
                  name="province"
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  placeholder="Contoh: DKI Jakarta"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-medium text-foreground">Alamat Lengkap</label>
                <textarea
                  name="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={2}
                  placeholder="Jl. Pendidikan No. 123..."
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <input type="hidden" name="is_active" value="true" />
            </div>

            <div className="flex justify-end pt-4 border-t">
              <button
                type="button"
                disabled={!isStep1Valid}
                onClick={() => setStep(2)}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                <span>Lanjut: Akun Admin</span>
                <ArrowRight className="size-4" />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            {/* Hidden fields to retain Step 1 values */}
            <input type="hidden" name="name" value={name} />
            <input type="hidden" name="npsn" value={npsn} />
            <input type="hidden" name="education_level" value={educationLevel} />
            <input type="hidden" name="email" value={email} />
            <input type="hidden" name="phone" value={phone} />
            <input type="hidden" name="city" value={city} />
            <input type="hidden" name="province" value={province} />
            <input type="hidden" name="address" value={address} />
            <input type="hidden" name="is_active" value="true" />

            <div className="flex items-center gap-2.5 pb-2 border-b">
              <UserPlus className="size-5 text-primary" />
              <div>
                <h3 className="font-semibold text-base">Akun Administrator Sekolah</h3>
                <p className="text-xs text-muted-foreground">
                  Akun operator utama yang akan bertanggung jawab mengelola jadwal dan data sekolah ini.
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4 text-xs text-blue-900 flex items-start gap-3">
              <Building2 className="size-4 text-blue-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Mendaftarkan untuk:</span> {name} ({educationLevel})
                {city ? ` — ${city}` : ""}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-medium text-foreground">
                  Nama Lengkap Admin <span className="text-red-500">*</span>
                </label>
                <input
                  name="admin_full_name"
                  value={adminFullName}
                  onChange={(e) => setAdminFullName(e.target.value)}
                  placeholder="Contoh: Budi Santoso, S.Kom."
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Email Login Admin <span className="text-red-500">*</span>
                </label>
                <input
                  name="admin_email"
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="budi.admin@sekolah.sch.id"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Username Login <span className="text-red-500">*</span>
                </label>
                <input
                  name="admin_username"
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  placeholder="admin_sman1sagaya"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-medium text-foreground">
                  Kata Sandi Sementara <span className="text-red-500">*</span>
                </label>
                <input
                  name="admin_password"
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  required
                />
                <p className="text-[11px] text-muted-foreground">
                  Admin dapat memperbarui kata sandi ini setelah login pertama kali.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-1.5 rounded-lg border px-4 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
              >
                <ArrowLeft className="size-4" />
                <span>Kembali</span>
              </button>

              <button
                type="submit"
                disabled={!isStep2Valid}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                <CheckCircle2 className="size-4" />
                <span>Selesaikan Onboarding</span>
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
