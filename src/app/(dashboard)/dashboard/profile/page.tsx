import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { ActionToast } from "@/components/master-data/action-toast";
import { FormSection } from "@/components/master-data/form-section";
import { saveProfileSettingsAction } from "@/features/profile/actions";
import { getProfileSettings } from "@/features/profile/queries";

type PageProps = {
  searchParams: Promise<{
    status?: string;
    message?: string;
  }>;
};

export default async function ProfilePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { user, profile } = await getProfileSettings();

  return (
    <div className="space-y-6">
      <ActionToast status={params.status} message={params.message} />
      <DashboardPageHeader
        title="Profil"
        description="Kelola identitas dasar akun yang digunakan di seluruh dashboard."
      />

      <section className="grid gap-4 lg:grid-cols-3">
        <DashboardCard
          title="Akun"
          value={user.roles?.label ?? user.roles?.name ?? "-"}
          description={`${user.email} | ${user.status}`}
        />
        <DashboardCard
          title="Username"
          value={user.username}
          description="Username internal aplikasi."
        />
        <DashboardCard
          title="Identitas Akademik"
          value={profile.nip || profile.nis || "-"}
          description={profile.nisn ? `NISN ${profile.nisn}` : "Dikelola oleh admin sekolah."}
        />
      </section>

      <FormSection
        title="Update Profil"
        description="Perubahan terbatas pada nama, telepon, dan avatar. Email, username, role, NIS/NIP dikelola admin."
      >
        <form action={saveProfileSettingsAction} className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="font-medium">Nama Lengkap</span>
            <input
              name="full_name"
              defaultValue={profile.full_name ?? ""}
              required
              className="h-10 w-full rounded-md border bg-background px-3 outline-none focus:ring-2 focus:ring-ring/40"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium">Telepon</span>
            <input
              name="phone"
              defaultValue={profile.phone ?? ""}
              className="h-10 w-full rounded-md border bg-background px-3 outline-none focus:ring-2 focus:ring-ring/40"
            />
          </label>
          <label className="space-y-1 text-sm md:col-span-2">
            <span className="font-medium">Avatar URL</span>
            <input
              name="avatar_url"
              defaultValue={profile.avatar_url ?? ""}
              className="h-10 w-full rounded-md border bg-background px-3 outline-none focus:ring-2 focus:ring-ring/40"
            />
          </label>
          <div className="md:col-span-2">
            <button className="h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              Simpan Profil
            </button>
          </div>
        </form>
      </FormSection>
    </div>
  );
}
