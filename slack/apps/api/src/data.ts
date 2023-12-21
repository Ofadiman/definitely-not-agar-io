import { Namespace, Room } from 'shared'

export const programmingNamespace: Namespace = {
  id: '29989651-60a4-4463-bcf1-689ba3c65f0f',
  name: 'programming',
  imageSrc:
    'https://fastly.picsum.photos/id/549/200/200.jpg?hmac=8HshVdK-H52hgb-zHj3AefpzafjOnwnqSPzsd0oFoDQ',
}

export const sportNamespace: Namespace = {
  id: 'aac0c753-a936-4c98-928c-7c941902556e',
  name: 'sport',
  imageSrc:
    'https://fastly.picsum.photos/id/122/200/200.jpg?hmac=AO77fWXJ61xiBlRhsCVFnWdzhJoxbrUP8288wd3Wdmg',
}

export const allNamespaces: Namespace[] = [programmingNamespace, sportNamespace]

export const javascriptRoom: Room = {
  id: '7c712a84-16ff-4593-9e7f-c2ef5f2f9e26',
  name: 'javascript',
  namespaceId: programmingNamespace.id,
}

export const pythonRoom: Room = {
  id: '37ea94cf-ae05-417d-bea2-20b2b3c4d1d1',
  name: 'python',
  namespaceId: programmingNamespace.id,
}

export const vimRoom: Room = {
  id: '81f4a849-91e7-4613-b47c-96dcd3154ca8',
  name: 'python',
  namespaceId: programmingNamespace.id,
}

export const swimmingRoom: Room = {
  id: '9a0a690a-4816-4d94-aad8-56654cd4e409',
  name: 'swimming',
  namespaceId: sportNamespace.id,
}

export const runningRoom: Room = {
  id: '8aab2d64-36f5-4cb7-b78e-4007c2436b33',
  name: 'running',
  namespaceId: sportNamespace.id,
}

export const allRooms: Room[] = [javascriptRoom, pythonRoom, vimRoom, swimmingRoom, runningRoom]
