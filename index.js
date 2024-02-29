// @flow

type ComponentType = 
    'ACQUISITIONS_EPIC' |
    'ACQUISITIONS_OTHER' | 
    'ACQUISITIONS_INTERACTIVE_SLICE' |
    'ACQUISITIONS_NUGGET' |
    'ACQUISITIONS_THRASHER';

export const componentTypes = {
    EPIC: 'ACQUISITIONS_EPIC',
    OTHER: 'ACQUISITIONS_OTHER',
    INTERACTIVE_SLICE: 'ACQUISITIONS_INTERACTIVE_SLICE',
    NUGGET: 'ACQUISITIONS_NUGGET',
    THRASHER: 'ACQUISITIONS_THRASHER',
}

type Source = 
    'GUARDIAN_WEB' |
    'GUARDIAN_APP_IOS'|
    'GUARDIAN_APP_ANDROID';

export const sources = {
    WEB: 'GUARDIAN_WEB',
    IOS: 'GUARDIAN_APP_IOS',
    ANDROID: 'GUARDIAN_APP_ANDROID',
    EMAIL: 'EMAIL',
    SOCIAL: 'SOCIAL',
    SEARCH: 'SEARCH',
    PPC: 'PPC',
    DIRECT: 'DIRECT',
}

type InitialAcquisitionData = {
    componentId: ?string,
    componentType: ?ComponentType,
    campaignCode: ?string,
    source: ?Source,
}

type ParentAcquisitionData = {
    source: ?Source,
    referrerUrl: ?string,
    referrerPageviewId: ?string,
}

// Source may be provided initially e.g. if the component is being used in an email
// or provided by the parent e.g. the component is being embedded in the Guardian website and webviews on App
type ReferrerAcquisitionData = InitialAcquisitionData & ParentAcquisitionData;

const PARENT_DATA_REQUEST = 'acquisition-data-request';
const PARENT_DATA_RESPONSE = 'acquisition-data-response';
const ACQUISITION_DATA_QUERY_STRING_FIELD = 'acquisitionData';
const ACQUISITION_LINK_CLASS = 'js-acquisition-link';

function upsertAcquistionDataInUrl(rawUrl: string, newData: ReferrerAcquisitionData): string {
    let url;
    try {
        url = new URL(rawUrl);
    } catch (err) {
        return rawUrl;
    }

    let data = {};
    const json = url.searchParams.get(ACQUISITION_DATA_QUERY_STRING_FIELD);
    if (json) {
        try {
            data = JSON.parse(json);
        } catch (err) {
            return rawUrl;
        }
    }

    const updatedData = {...data, ...newData};
    url.searchParams.set(ACQUISITION_DATA_QUERY_STRING_FIELD, JSON.stringify(updatedData));
    return url.toString();
}

function upsertAcquisitionDataInUrls(data: ReferrerAcquisitionData): void {
    [...document.getElementsByClassName(ACQUISITION_LINK_CLASS)].forEach(el => {
        const href = el.getAttribute('href');
        if (href) {
            el.setAttribute('href', upsertAcquistionDataInUrl(href, data));
        }
    })
}

function isInIframe(): boolean {
    try {
        return window.self !== window.top;
    } catch (e) {
        return true;
    }
}

function deserializeEventData(event: MessageEvent): ?Object {
    if (typeof event.data === 'string') {
        try {
            return JSON.parse(event.data)
        } catch (e) {}
    }
}

function requestParentAcquisitionData(): void {
    const message = { type:  PARENT_DATA_REQUEST };
    window.parent.postMessage(JSON.stringify(message), '*');
    window.addEventListener('message', function(event) {
        if (event.source !== window.parent) {
            return;
        }
        const data = deserializeEventData(event);
        if (data && data.type === PARENT_DATA_RESPONSE) {
            upsertAcquisitionDataInUrls(data.acquisitionData);
        }
    })
}

function initPolyfill(): void {
    const polyfillSrc = 'https://assets.guim.co.uk/polyfill.io/v3/polyfill.min.js?features=Array.from,URL';
    const polyfillEl = document.createElement('script');
    polyfillEl.setAttribute('src', polyfillSrc);
    if (document.head) {
        document.head.appendChild(polyfillEl);
    }
}

export function enrichLinks(data: ReferrerAcquisitionData): void {
    initPolyfill();
    upsertAcquisitionDataInUrls(data);
    if (isInIframe()) {
        requestParentAcquisitionData();
    }
}

export function respondToIFrameRequest(
    getIframeElements: MessageEvent => HTMLIFrameElement[],
    getParentAcquisitionData: void => ParentAcquisitionData
): void {
    window.addEventListener('message', function(event: MessageEvent) {
        const data = deserializeEventData(event)
        if (data && data.type === PARENT_DATA_REQUEST) {
            getIframeElements(event).forEach(el => {
                const message = {
                    type: PARENT_DATA_RESPONSE,
                    acquisitionData: getParentAcquisitionData()
                }
                el.contentWindow.postMessage(JSON.stringify(message), '*')
            })
        }
    })
}

export function getIframeElementsBySrc(event: MessageEvent): HTMLIFrameElement[] {
    const href = event.source.location.href;
    return [...document.getElementsByTagName('iframe')].filter(el =>
         el.getAttribute('src') === href
    );
}
