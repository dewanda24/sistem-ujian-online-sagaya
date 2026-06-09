import { ConfirmSubmitButton } from "@/components/dashboard/confirm-submit-button";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { SubmitButton } from "@/components/dashboard/submit-button";
import { ActionToast } from "@/components/master-data/action-toast";
import { DataTable } from "@/components/master-data/data-table";
import { FormSection } from "@/components/master-data/form-section";
import { StatusBadge } from "@/components/master-data/status-badge";
import {
  deleteQuestionStimulusAction,
  saveQuestionStimulusAction,
  toggleQuestionStimulusAction,
} from "@/features/question-bank/actions";
import { QuestionBankFilters } from "@/features/question-bank/components/question-bank-filters";
import { QuestionMathRenderer } from "@/features/question-bank/components/question-math-renderer";
import { QuestionMediaPreview } from "@/features/question-bank/components/question-media-preview";
import {
  getDefaultSchoolId,
  getQuestionStimuli,
  getScopedSubjectOptions,
} from "@/features/question-bank/queries";
import { requirePermission } from "@/lib/auth/require-permission";

type PageProps = {
  searchParams: Promise<{
    q?: string;
    subject_id?: string;
    edit?: string;
    notice?: string;
    message?: string;
  }>;
};

export default async function QuestionStimuliPage({ searchParams }: PageProps) {
  await requirePermission("question_bank.view");
  const params = await searchParams;
  const [subjects, schoolId, stimuli] = await Promise.all([
    getScopedSubjectOptions(),
    getDefaultSchoolId(),
    getQuestionStimuli({
      q: params.q,
      subject_id: params.subject_id,
    }),
  ]);
  const editable = stimuli.find((stimulus) => stimulus.id === params.edit);

  return (
    <div className="space-y-6">
      <ActionToast status={params.notice} message={params.message} />
      <DashboardPageHeader
        title="Stimulus / Bacaan"
        description="Kelola bacaan, gambar, audio, video, atau pengantar yang dapat dipakai bersama oleh banyak soal."
      />

      <FormSection
        title={editable ? "Edit Stimulus" : "+ Buat Stimulus"}
        description="Stimulus dapat dipakai ulang oleh beberapa soal dalam mapel yang sama."
      >
        <form
          action={saveQuestionStimulusAction}
          className="grid gap-4 md:grid-cols-2"
        >
          <input type="hidden" name="id" defaultValue={editable?.id ?? ""} />
          <input type="hidden" name="school_id" value={schoolId ?? ""} />
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Mapel</span>
            <select
              name="subject_id"
              defaultValue={
                editable?.subject_id ?? params.subject_id ?? subjects[0]?.value ?? ""
              }
              className="rounded-md border px-3 py-2 text-sm"
              required
            >
              <option value="">Pilih mapel</option>
              {subjects.map((subject) => (
                <option key={subject.value} value={subject.value}>
                  {subject.label}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Judul stimulus</span>
            <input
              name="title"
              defaultValue={editable?.title ?? ""}
              placeholder="Contoh: Teks Lingkungan Sekolah"
              className="rounded-md border px-3 py-2 text-sm"
              required
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Tipe media</span>
            <select
              name="media_type"
              defaultValue={editable?.media_type ?? ""}
              className="rounded-md border px-3 py-2 text-sm"
            >
              <option value="">Text</option>
              <option value="image">Image</option>
              <option value="audio">Audio</option>
              <option value="video">Video</option>
              <option value="file">File/PDF</option>
              <option value="link">Link</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium">URL media</span>
            <input
              name="media_url"
              defaultValue={editable?.media_url ?? ""}
              placeholder="https://..."
              className="rounded-md border px-3 py-2 text-sm"
            />
          </label>
          <label className="grid gap-1 text-sm md:col-span-2">
            <span className="font-medium">Isi bacaan / pengantar</span>
            <textarea
              name="content"
              defaultValue={editable?.content ?? ""}
              placeholder="Tulis bacaan, pengantar, atau instruksi stimulus"
              className="min-h-36 rounded-md border px-3 py-2 text-sm"
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              name="is_active"
              type="checkbox"
              defaultChecked={editable?.is_active ?? true}
            />
            Aktif
          </label>
          <div className="flex justify-end md:col-span-2">
            <SubmitButton loadingText={editable ? "Memperbarui..." : "Menyimpan..."}>
              Simpan Stimulus
            </SubmitButton>
          </div>
        </form>
      </FormSection>

      <QuestionBankFilters
        subjects={subjects}
        defaults={{
          q: params.q,
          subject_id: params.subject_id,
        }}
      />

      <DataTable
        columns={["Stimulus", "Mapel", "Media", "Dipakai", "Status", "Aksi"]}
        isEmpty={stimuli.length === 0}
        empty={
          <EmptyState
            title="Belum ada stimulus"
            description="Tambahkan stimulus agar bacaan atau pengantar dapat dipakai oleh beberapa soal."
          />
        }
      >
        {stimuli.map((stimulus) => (
          <tr key={stimulus.id} className="align-top">
            <td className="max-w-xl px-4 py-3">
              <div className="font-medium">{stimulus.title}</div>
              <div className="mt-2 line-clamp-4 text-sm text-muted-foreground">
                <QuestionMathRenderer content={stimulus.content} />
              </div>
              {Number(stimulus.question_count ?? 0) > 1 ? (
                <div className="mt-2 text-xs font-medium text-emerald-700">
                  Stimulus ini digunakan oleh beberapa soal.
                </div>
              ) : null}
            </td>
            <td className="px-4 py-3">
              {stimulus.subjects
                ? `${stimulus.subjects.code} - ${stimulus.subjects.name}`
                : "-"}
            </td>
            <td className="px-4 py-3">
              <QuestionMediaPreview
                mediaType={stimulus.media_type}
                url={stimulus.media_url}
                title={stimulus.title}
              />
              {!stimulus.media_url ? "-" : null}
            </td>
            <td className="px-4 py-3">{stimulus.question_count ?? 0} soal</td>
            <td className="px-4 py-3">
              <StatusBadge active={Boolean(stimulus.is_active)} />
            </td>
            <td className="px-4 py-3">
              <div className="flex flex-wrap gap-2">
                <a
                  href={`/dashboard/question-bank/stimuli?edit=${stimulus.id}`}
                  className="rounded-md border px-3 py-1.5 text-xs hover:bg-muted"
                >
                  Edit
                </a>
                <form action={toggleQuestionStimulusAction}>
                  <input type="hidden" name="id" value={stimulus.id} />
                  <input
                    type="hidden"
                    name="is_active"
                    value={stimulus.is_active ? "false" : "true"}
                  />
                  <ConfirmSubmitButton
                    confirmMessage={`${
                      stimulus.is_active ? "Nonaktifkan" : "Aktifkan"
                    } stimulus ${stimulus.title}?`}
                  >
                    {stimulus.is_active ? "Nonaktifkan" : "Aktifkan"}
                  </ConfirmSubmitButton>
                </form>
                <form action={deleteQuestionStimulusAction}>
                  <input type="hidden" name="id" value={stimulus.id} />
                  <ConfirmSubmitButton
                    confirmMessage="Arsipkan stimulus ini? Soal lama yang masih memakai stimulus ini tetap menyimpan relasinya, tetapi stimulus tidak akan muncul sebagai pilihan aktif."
                    confirmationText="HAPUS"
                    variant="danger"
                  >
                    Arsipkan
                  </ConfirmSubmitButton>
                </form>
              </div>
            </td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}
