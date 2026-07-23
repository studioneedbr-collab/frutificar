import { prisma } from '@/lib/prisma'

export async function listEpisodes() {
  return prisma.podcastEpisode.findMany({
    include: { podcast: { select: { title: true } } },
    orderBy: { publishedAt: 'desc' },
  })
}

export async function getOrCreateDefaultPodcast() {
  const existing = await prisma.podcast.findFirst()
  if (existing) return existing

  return prisma.podcast.create({
    data: {
      title: 'Frutificar no Campo',
      description: 'Conversas sobre cafeicultura, solo e gestão rural.',
    },
  })
}

export async function createEpisode(data: {
  title: string
  podcastId?: string
  audioUrl?: string
  publishedAt: Date
}) {
  const podcastId = data.podcastId ?? (await getOrCreateDefaultPodcast()).id

  return prisma.podcastEpisode.create({
    data: {
      podcastId,
      title: data.title,
      audioUrl: data.audioUrl,
      publishedAt: data.publishedAt,
    },
  })
}

export async function updateEpisode(
  id: string,
  data: { title?: string; audioUrl?: string; publishedAt?: Date; published?: boolean },
) {
  return prisma.podcastEpisode.update({
    where: { id },
    data: {
      title: data.title,
      audioUrl: data.audioUrl,
      publishedAt: data.publishedAt,
      published: data.published,
    },
  })
}

export async function deleteEpisode(id: string) {
  return prisma.podcastEpisode.delete({ where: { id } })
}
