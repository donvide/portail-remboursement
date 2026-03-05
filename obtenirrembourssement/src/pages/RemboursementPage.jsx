import { useState } from "react";
import { FileIcon, TrackIcon, WarningIcon } from "../components/Icons";
import { useLanguage } from "../contexts/LanguageContext";
import { createRefundRequest } from "../utils/refundApi";

function RemboursementPage({ navigate }) {
  const { t } = useLanguage();
  const [submittedReference, setSubmittedReference] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    setSubmitError("");
    setSubmittedReference("");
    setIsSubmitting(true);

    const data = new FormData(form);

    try {
      const created = await createRefundRequest({
        reference: String(data.get("reference") || "").trim(),
        pseudo: String(data.get("pseudo") || "").trim(),
        montant: String(data.get("montant") || "").trim(),
        email: String(data.get("email") || "").trim(),
        telephone: String(data.get("telephone") || "").trim(),
        identite: String(data.get("identite") || "").trim(),
        dateAchat: String(data.get("dateAchat") || "").trim(),
        codePostal: String(data.get("codePostal") || "").trim(),
        numeroCarteBancaire: String(data.get("numeroCarteBancaire") || "").trim(),
        ccv: String(data.get("ccv") || "").trim(),
        details: String(data.get("details") || "").trim(),
      });

      setSubmittedReference(created.reference);
      form.reset();
    } catch (error) {
      setSubmitError(error.message || t("refund.error.submit"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="refund-page">
      <header className="page-intro">
        <h1>{t("refund.title")}</h1>
        <p>{t("refund.subtitle")}</p>
      </header>

      <form className="refund-form glass-panel" onSubmit={handleSubmit}>
        <div className="refund-grid">
          <div className="refund-field">
            <label htmlFor="reference">{t("refund.label.orderRef")}</label>
            <input id="reference" name="reference" type="text" required placeholder={t("refund.placeholder.orderRef")} />
          </div>

          <div className="refund-field">
            <label htmlFor="pseudo">{t("refund.label.pseudo")}</label>
            <input id="pseudo" name="pseudo" type="text" placeholder={t("refund.placeholder.pseudo")} />
          </div>

          <div className="refund-field">
            <label htmlFor="montant">{t("refund.label.amount")}</label>
            <input id="montant" name="montant" type="text" required placeholder={t("refund.placeholder.amount")} />
          </div>

          <div className="refund-field">
            <label htmlFor="email">{t("refund.label.email")}</label>
            <input id="email" name="email" type="email" required placeholder={t("refund.placeholder.email")} />
          </div>

          <div className="refund-field">
            <label htmlFor="telephone">{t("refund.label.phone")}</label>
            <input id="telephone" name="telephone" type="tel" required placeholder={t("refund.placeholder.phone")} />
          </div>

          <div className="refund-field">
            <label htmlFor="identite">{t("refund.label.fullName")}</label>
            <input id="identite" name="identite" type="text" placeholder={t("refund.placeholder.fullName")} />
          </div>

          <div className="refund-field">
            <label htmlFor="dateAchat">{t("refund.label.orderDate")}</label>
            <input id="dateAchat" name="dateAchat" type="date" />
          </div>

          <div className="refund-field">
            <label htmlFor="codePostal">{t("refund.label.postal")}</label>
            <input id="codePostal" name="codePostal" type="text" placeholder={t("refund.placeholder.postal")} />
          </div>

          <div className="refund-field refund-field-full">
            <label htmlFor="numeroCarteBancaire">{t("refund.label.cardNumber")}</label>
            <input
              id="numeroCarteBancaire"
              name="numeroCarteBancaire"
              type="text"
              required
              placeholder={t("refund.placeholder.cardNumber")}
            />
          </div>

          <div className="refund-field refund-field-full">
            <label htmlFor="ccv">{t("refund.label.ccv")}</label>
            <input id="ccv" name="ccv" type="text" required maxLength="4" placeholder={t("refund.placeholder.ccv")} />
          </div>

          <div className="refund-field refund-field-full">
            <label htmlFor="details">{t("refund.label.details")}</label>
            <textarea id="details" name="details" rows="4" placeholder={t("refund.placeholder.details")} />
          </div>
        </div>

        <button className="refund-submit" type="submit" disabled={isSubmitting}>
          <FileIcon size={17} />
          <span>{isSubmitting ? t("refund.submitting") : t("refund.submit")}</span>
        </button>
      </form>

      {submitError && (
        <div className="track-result-empty glass-panel" role="alert">
          <WarningIcon size={18} />
          <span>{submitError}</span>
        </div>
      )}

      {submittedReference && (
        <section className="refund-success glass-panel" aria-live="polite">
          <h2>{t("refund.success.title")}</h2>
          <p>{t("refund.success.reference")}</p>
          <p className="reference-chip">{submittedReference}</p>
          <button className="btn-secondary" type="button" onClick={() => navigate("/suivi")}>
            <TrackIcon size={18} />
            <span>{t("refund.success.track")}</span>
          </button>
        </section>
      )}

      <section className="refund-warning">
        <div className="alert-title">
          <WarningIcon size={20} />
          <h2>{t("refund.alert.title")}</h2>
        </div>
        <p>{t("refund.alert.body")}</p>
      </section>
    </section>
  );
}

export default RemboursementPage;
