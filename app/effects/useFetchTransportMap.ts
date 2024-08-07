import { useEffect, useMemo, useState } from 'react'
import { gtfsServerUrl } from '../serverUrls'
import { decodeTransportsData } from '../transport/decodeTransportsData'

export default function useFetchTransportMap(
	active,
	day,
	bbox,
	agence,
	noCache,
	tout
) {
	const [data, setData] = useState([])
	useEffect(() => {
		if (!active || agence == null) return
		if (data.find(([agencyId]) => agencyId === agence)) return

		const doFetch = async () => {
			const url = `${gtfsServerUrl}/agencyArea/${agence}`

			const request = await fetch(url)
			const json = await request.json()

			const newAgencies = [[agence, json]].map(decodeTransportsData)

			console.log('newa', newAgencies)
			setData((data) => [...data, ...newAgencies])
		}
		doFetch()
	}, [agence, data, active, setData])
	useEffect(() => {
		if (!active || !tout) return

		const doFetch = async () => {
			const url = `${gtfsServerUrl}/agencyAreas`

			const request = await fetch(url)
			const json = await request.json()

			const newAgencies = Object.entries(json).map(decodeTransportsData)

			// filter all national lines
			const filtered = rejectNationalAgencies(newAgencies)
			setData(filtered)
		}
		doFetch()
	}, [active, tout, setData])
	useEffect(() => {
		if (!active || !bbox || tout) return
		if (agence != null) return

		const abortController = new AbortController()
		const doFetch = async () => {
			const [[longitude2, latitude], [longitude, latitude2]] = bbox

			const url = (format) =>
				`${gtfsServerUrl}/agencyArea/${latitude}/${longitude}/${latitude2}/${longitude2}/${format}/`

			try {
				const request = await fetch(url('prefetch'), {
					mode: 'cors',
					signal: abortController.signal,
				})
				const relevantAgencyIds = await request.json()

				const cacheAgencyIds = data.map(([id]) => id),
					newAgencyIds = relevantAgencyIds.filter(
						(id) => !cacheAgencyIds.includes(id)
					)

				if (!newAgencyIds.length) {
					return setData(
						data.filter(([agency]) => relevantAgencyIds.includes(agency))
					)
				}

				// TODO if agence, don't bother with the matching bbox, we just want to
				// show the line infos quickly and zoom the map on the relevant zone
				const dataRequest = await fetch(
					url('geojson') +
						newAgencyIds.join('|') +
						(noCache ? `?noCache=${noCache}` : ''),
					{
						mode: 'cors',
						signal: abortController.signal,
					}
				)

				const dataJson = await dataRequest.json()

				const newAgencies = dataJson.map(decodeTransportsData)
				if (noCache) {
					setData(newAgencies)
				} else {
					const newData = [
						...data.filter(
							([id]) =>
								relevantAgencyIds.includes(id) && !newAgencyIds.includes(id)
						),
						...newAgencies,
					]
					console.log(
						'transportmap new data',
						newData,
						relevantAgencyIds,
						newAgencyIds
					)
					setData(newData)
				}
			} catch (e) {
				if (abortController.signal.aborted) {
					console.log(
						"Requête précédente annulée, sûrement suite à un changement de bbox avant que la requête n'ait eu le temps de finir"
					)
				} else {
					console.error(e)
				}
			}
		}
		doFetch()
		return () => {
			abortController.abort()
		}
	}, [setData, bbox, active, day, agence, noCache, tout])

	const agencyIdsHash = data?.map(([a]) => a).join('<|>')
	const transportsData = useMemo(() => {
		return data
	}, [agencyIdsHash])

	console.log('orange', transportsData)
	return active ? transportsData : null
}

const rejectNationalAgencies = (data) =>
	data.filter(
		([agencyId, agencyData]) =>
			agencyId != 1187 &&
			agencyId != 0 &&
			!agencyId.includes('FLIXBUS') &&
			agencyId != 'OCEdefault' &&
			!agencyId.startsWith('ATOUMOD') &&
			agencyId !== 'ER' &&
			agencyId !== 'ES' &&
			agencyId !== 'TAMM' && // this one has problems with coordinates
			agencyId !== 'STAN' // this one has problems with coordinates
	)
