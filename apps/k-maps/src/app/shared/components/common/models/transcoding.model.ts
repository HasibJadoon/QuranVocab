export interface ITranscoding {
  // Code l'entité
  entity?: string;
  // Entity_id : id du tiers pour lequel il y a transcodification
  third_party_id?: string;
  // Code externe pour l'entity
  x_code: string;
  // Transcoding tier sortant
  check_outgoing_transcoding?: boolean;
  // Nom à publier
  x_name?: string;
}
