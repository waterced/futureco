//TODO complete with spec possibilities https://gtfs.org/fr/schedule/reference/#routestxt
export default function (frenchTrainType, prefix) {
	if (frenchTrainType) return `/transit/${frenchTrainType.toLowerCase()}.svg`
	return ['flixbus', 'blablacar'].includes(prefix)
		? `/transit/${prefix}.svg`
		: null
}

const typeIconCorrespondance = {
	0: '/icons/tram.svg',
	1: '/icons/metro.svg',
	2: '/icons/train.svg',
	3: '/icons/bus.svg',
	4: '/icons/ferry.svg',
	5: '/icons/tram.svg', // so rare
	6: '/icons/téléphérique.svg',
	7: '/icons/funiculaire.svg',
	11: '/icons/trolleybus.svg',
	12: '/icons/train.svg', // how to represent this ?
}

export function transportTypeIcon(routeType, route) {
	if (route?.route_id === 'BIBUS:C') return typeIconCorrespondance[6] // LOL, merci bibus, you had one job...
	const found = typeIconCorrespondance[routeType]
	return found || '/icons/bus.svg'
}

const routeTypeCorrespondance = {
	0: 'tram',
	1: 'métro',
	2: 'train',
	3: 'bus',
	4: 'ferry',
	5: 'tram à câble', // so rare
	6: 'téléphérique',
	7: 'funiculaire',
	11: 'trolleybus',
	12: 'monorail', // how to represent this ?
}
export const routeTypeName = (routeType) => {
	return routeTypeCorrespondance[routeType]
}
