import * as qs from 'querystring';
import * as _ from 'lodash';

interface PageData {
    page: number;
    active: boolean;
    qs: string;
}

interface Separator {
    separator: true;
}

interface PaginationData {
    prev: { page: number; active: boolean; qs: string };
    next: { page: number; active: boolean; qs: string };
    first: { page: number; active: boolean; qs: string };
    last: { page: number; active: boolean; qs: string };
    rel: { rel: string; href: string }[];
    pages: (PageData | Separator)[];
    currentPage: number;
    pageCount: number;
}

const pagination: {
    create: (currentPage: number, pageCount: number, queryObj: Record<string, string | number>) => PaginationData;
} = {
    create(currentPage, pageCount, queryObj) {
        if (pageCount <= 1) {
            return {
                prev: { page: 1, active: currentPage > 1, qs: '' },
                next: { page: 1, active: currentPage < pageCount, qs: '' },
                first: { page: 1, active: currentPage === 1, qs: '' },
                last: { page: 1, active: currentPage === pageCount, qs: '' },
                rel: [],
                pages: [],
                currentPage: 1,
                pageCount: 1,
            };
        }

        pageCount = parseInt(String(pageCount), 10);
        let pagesToShow = [1, 2, pageCount - 1, pageCount];

        currentPage = parseInt(String(currentPage), 10) || 1;
        const previous = Math.max(1, currentPage - 1);
        const next = Math.min(pageCount, currentPage + 1);

        let startPage = Math.max(1, currentPage - 2);
        if (startPage > pageCount - 5) {
            startPage -= 2 - (pageCount - currentPage);
        }
        let i: number;
        for (i = 0; i < 5; i += 1) {
            pagesToShow.push(startPage + i);
        }

        pagesToShow = _.uniq(pagesToShow).filter(page => page > 0 && page <= pageCount).sort((a, b) => a - b);

        queryObj = { ...(queryObj || {}) };

        delete queryObj._;

        const pages: (PageData | Separator)[] = pagesToShow.map((page) => {
            queryObj.page = page;
            return { page, active: page === currentPage, qs: qs.stringify(queryObj) } as PageData;
        });

        for (i = pages.length - 1; i > 0; i -= 1) {
            if ((pages[i] as PageData).page - 2 === (pages[i - 1] as PageData).page) {
                pages.splice(i, 0, {
                    page: (pages[i] as PageData).page - 1,
                    active: false,
                    qs: qs.stringify(queryObj),
                } as PageData);
            } else if ((pages[i] as PageData).page - 1 !== (pages[i - 1] as PageData).page) {
                pages.splice(i, 0, { separator: true } as Separator);
            }
        }

        const data: PaginationData = {
            rel: [],
            pages,
            currentPage,
            pageCount,
            prev: {
                page: 0,
                active: false,
                qs: '',
            },
            next: {
                page: 0,
                active: false,
                qs: '',
            },
            first: {
                page: 0,
                active: false,
                qs: '',
            },
            last: {
                page: 0,
                active: false,
                qs: '',
            },
        };
        queryObj.page = previous;
        data.prev = { page: previous, active: currentPage > 1, qs: qs.stringify(queryObj) };
        queryObj.page = next;
        data.next = { page: next, active: currentPage < pageCount, qs: qs.stringify(queryObj) };

        queryObj.page = 1;
        data.first = { page: 1, active: currentPage === 1, qs: qs.stringify(queryObj) };
        queryObj.page = pageCount;
        data.last = { page: pageCount, active: currentPage === pageCount, qs: qs.stringify(queryObj) };

        if (currentPage < pageCount) {
            data.rel.push({
                rel: 'next',
                href: `?${qs.stringify({ ...queryObj, page: next })}`,
            });
        }

        if (currentPage > 1) {
            data.rel.push({
                rel: 'prev',
                href: `?${qs.stringify({ ...queryObj, page: previous })}`,
            });
        }

        return data;
    },
};

export default pagination;
